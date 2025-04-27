# Israeli Street Names Importer - by Roy Chehmer
This project fetches street names for cities in Israel and inserts them into a database using a queueing platform.

## Goals
- Fetch street name data from an external API.
- Use a queueing platform to handle the data flow.
- Insert the street data into a database using a single consumer.

## Tech Stack
- **Queueing Platform:** RabbitMQ – simple FIFO queue with a single consumer. (User: guest ,Pass: guest)
- **Database:** PostgreSQL – relational database with a small and simple schema to store street references. (User: user ,Pass: password, DB: DataLoop)

## Project Structure
- `StreetsService.ts`: Fetches street names via API, handles queue publishing/consuming, and manages table creation.
- `cities.ts`: Contains a list of Israeli cities to process.
- `producer.ts`: Reads city names, fetches street data, and publishes it to the queue.
- `consumer.ts`: Listens to the queue and inserts street data into the database.

## Assumptions, Data Processing Rules & Key Features
- A **single consumer** is responsible for pulling messages from the queue.
- Data consistency is crucial — each record should exist only **once** (no duplicates).
- Since the data contains **multiple entities** (e.g., cities and streets) with important relationships, it is **separated into distinct database tables**.
- Street data is stored in **normalized tables**, structured according to their **business context** (e.g., `cities`, `streets`).
- The **producer** is responsible for managing `city_name` and triggering the street-fetching process.
- The **consumer** is asynchronous listener which keep the script alive, listening to the queue and saving new street data while the messages arrive.
- The number of street records fetched per city is limited to 10, but this can be adjusted as needed.
- any existing record that will be push the DB will update the record, only new records will be added.

## Diagrams
- Publisher -> retrives by cli cuty name and pulls the related detailed streets -> pushs the details to RabbitMQ.
- Consumer -> runs in background -> pulls messages from RabbitMQ -> saves the details in PostgreSQL DB.

## ERD 
Streets N-1 Cities N-1 Regions
Description: Each streets Entity have a city and each city belongs to one region
Due to the number of the records and the relationships between the entities, we dont need NoSql or Big Data DB, we can afford without any concerns to store the data in Relationship DB.

## Instructions - How to create the infrastructure and execute the project
- clone the project to local machine or download the Zip file
- cd DataLoopaAssesment\dm-interview-assignment
- execute deploy.bat
- execute consumer by: npm run consumer 
- execute producer by: npm run producer "אשדוד" (for example)
