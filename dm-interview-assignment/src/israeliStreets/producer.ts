#!/usr/bin/env ts-node

import { StreetsService } from './StreetsService'
import { cities, city } from './cities';

const run = async () => {
	// getting args while skipping the first two
	const args = process.argv.slice(2)

	if (args.length === 0) {
		console.error('Error: City name should be included in the arguments!')
		process.exit(1)
	}

	const cityName = args[0]
	console.log(`Get streets for city named: "${cityName}"`)

	// searching city from the cities object
	const matchedCity = Object.entries(cities).find(([_, value]) => value === cityName)	
	if (!matchedCity) {
		console.error(`Error: City "${cityName}" not found in the cities list.`)
		process.exit(1)
	}

	const cityKey = matchedCity[0] as city;

	try {	
		// getting list of streets in city
		const result = await StreetsService.getStreetsInCity(cityKey)
		console.log(`${result.streets.length} Streets found in "${cityName}".`)

		const detailedStreets = [];
		for (const street of result.streets) {
		  const info = await StreetsService.getStreetInfoById(street.streetId);
		  detailedStreets.push(info);
		}				

		// publishing the retrieve streets.
		await StreetsService.startPublish(detailedStreets);		

	} catch (err: any) {
		console.error(`Error: ${err.message}`)
		process.exit(1)
	}
}

run()
