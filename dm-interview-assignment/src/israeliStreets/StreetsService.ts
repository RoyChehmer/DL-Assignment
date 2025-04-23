import axios, { Axios } from 'axios';
import { omit } from 'lodash';
import * as amqp from 'amqplib';
import { Client } from 'pg'; 
import { cities, city, englishNameByCity } from './cities';

const QUEUE_NAME = 'Streets';
const RABBITMQ_URL = 'amqp://localhost:5672';

const PG_CONFIG = {
	user: 'user',
	host: 'localhost',
	database: 'DataLoop',
	password: 'password',
	port: 5432,
  };

export interface Street extends Omit<ApiStreet, '_id'>{
	streetId: number
}

interface ApiStreet{
	_id: number
	region_code: number
	region_name: string
	city_code: number
	city_name: string
	street_code: number
	street_name: string
	street_name_status: string
	official_code: number
}


export class StreetsService{
	private static _axios: Axios
	private static get axios(){
		if(!this._axios){
			this._axios = axios.create({})
		}
		return this._axios
	}
	static async getStreetsInCity(city: city): Promise<{city: city, streets: Pick<Street, 'streetId' | 'street_name'>[]}>{		
		const res = (await this.axios.post('https://data.gov.il/api/3/action/datastore_search', {resource_id:`1b14e41c-85b3-4c21-bdce-9fe48185ffca`, filters: {city_name: cities[city]}, limit: 10})).data						

		const results = res.result.records
		if (!results || !results.length) {
			throw new Error('No streets found for city: ' + city)
		}
		const streets: Pick<Street, 'streetId' | 'street_name'>[]  = results.map((street: ApiStreet) => { 
			return {streetId: street._id, street_name: street.street_name.trim()}
		})
		return {city, streets}
	}

	static async getStreetInfoById(id: number){
		const res = (await this.axios.post('https://data.gov.il/api/3/action/datastore_search', {resource_id:`1b14e41c-85b3-4c21-bdce-9fe48185ffca`, filters: {_id: id}, limit: 1})).data
		const results = res.result.records
		if (!results || !results.length) {
			throw new Error('No street found for id: ' + id)
		}
		const dbStreet: ApiStreet = results[0]
		const cityName = englishNameByCity[dbStreet.city_name]
		const street: Street = {...(omit<ApiStreet>(dbStreet, '_id') as Omit<ApiStreet, '_id'>), streetId: dbStreet._id, city_name: cityName, region_name: dbStreet.region_name.trim(), street_name: dbStreet.street_name.trim()}
		return street
	}

	  static async startPublish(streets: Pick<Street, 'streetId' | 'street_name' | 'region_code' | 'region_name' | 'city_code' | 'city_name' | 'street_code' | 'street_name_status' | 'official_code' >[])
	  {	  

		const connection = await amqp.connect(RABBITMQ_URL);
		const channel = await connection.createChannel();
	  
		//creating a queue if not exist at the disk
		await channel.assertQueue(QUEUE_NAME, { durable: true });
	  						
		for (const street of streets) {
			try {				
				const msg = Buffer.from(JSON.stringify(street));
				channel.sendToQueue(QUEUE_NAME, msg);
			}
			catch (error) {
				console.error(`Error while sendToQueue for street ID ${street.streetId}: `, error);
			} 
		}				
	  
		await channel.close();
		await connection.close();
	  }

	  static async createTables()
	  {
		const pgClient = new Client(PG_CONFIG);
		await pgClient.connect();		 

		await pgClient.query(`
			CREATE TABLE IF NOT EXISTS regions (
			region_id SERIAL PRIMARY KEY,			  
			region_code INTEGER NOT NULL,
			region_name TEXT NOT NULL,
			UNIQUE (region_code)
			)
		`);

		await pgClient.query(`
			CREATE TABLE IF NOT EXISTS cities (
			city_id SERIAL PRIMARY KEY,			  
			region_code INTEGER NOT NULL,			
			city_code INTEGER NOT NULL,
			city_name TEXT NOT NULL,
			UNIQUE (region_code, city_code)
			)
		`);
	
		await pgClient.query(`
			CREATE TABLE IF NOT EXISTS streets (
			id SERIAL PRIMARY KEY,			
			city_code INTEGER NOT NULL,
			street_code INTEGER NOT NULL,
			street_name TEXT NOT NULL,
			street_name_status TEXT NOT NULL,
			official_code INTEGER NOT NULL,
			UNIQUE (city_code, street_code)
			)
		`);	
	  }

	  static async startConsumer() {
		try {		  	  
		  const pgClient = new Client(PG_CONFIG);
		  await pgClient.connect();		 

		  // create tables if not exists.
		  const returnDB = await StreetsService.createTables()		  		  
	  
		  const connection = await amqp.connect(RABBITMQ_URL);
		  const channel = await connection.createChannel();	  	

		  //creating a queue if not exist at the disk
		  await channel.assertQueue(QUEUE_NAME, { durable: true });

		  console.log(`Listening to queue: ${QUEUE_NAME}`);		  
	  
		  // kepping the script alive, setup asynchronous listener
		  channel.consume(QUEUE_NAME, async (msg) => {
			if (msg !== null) {

			  const content = msg.content.toString();
			  try {
								
				const parsed: ApiStreet = JSON.parse(content);								
				
				const { _id, region_code, region_name, city_code, city_name , street_code, street_name, street_name_status,official_code} = parsed;								

				//update or insert new region record
				await pgClient.query(`INSERT INTO regions (region_code,region_name) VALUES ($1, $2) ON CONFLICT (region_code) DO UPDATE SET region_name = EXCLUDED.region_name`, 
					[region_code,region_name]
				);

				//update or insert new city record
				await pgClient.query(`INSERT INTO cities (region_code,city_code,city_name) VALUES ($1, $2, $3) ON CONFLICT (region_code,city_code) DO UPDATE SET city_name = EXCLUDED.city_name`, 
					[region_code,city_code,city_name]
				);
								
				//update or insert new street record
				await pgClient.query(
					`INSERT INTO streets (city_code,street_code,street_name,street_name_status,official_code) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (city_code, street_code) 
					DO UPDATE SET city_code = EXCLUDED.city_code, street_name = EXCLUDED.street_name, official_code = EXCLUDED.official_code`,
					[city_code, street_code, street_name, street_name_status, official_code]
				);
	  				
			  } catch (error) {
				console.error('Invalid JSON or DB error:', error);
			  }
			  // send feedback to RabbitMQ
			  channel.ack(msg);
			}
		  });
		} 
		catch (error) {
		  	console.error('Error in start consumer:', error);		 
			process.exit(1)	  	
		}
	}	  
}