# Israeli Street Names Importer
This project fetches street names for cities in Israel and inserts them into a PostgreSQL database using a queueing platform.

## Goals
- Fetch street name data from an external API.
- Use a queueing platform to handle the data flow.
- Insert the street data into a database using a single consumer.

## Tech Stack
- **Queueing Platform:** RabbitMQ – simple FIFO queue with a single consumer.
- **Database:** PostgreSQL – relational database with a small and simple schema to store street references.

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
- The **consumer** runs in the background, listening to the queue and saving new street data as messages arrive.
