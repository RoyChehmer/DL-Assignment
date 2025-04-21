# **DM-interview-assignment**
### Description
 - Assigment public repository for DM-interview-assignment
 ---
 # Israeli Street Names Importer
This project fetches street names for cities in Israel and inserts them into a database using a queueing platform.

The goal of this assignment is to:
- Fetch street name data from an external API.
- Use a queueing platform (e.g., RabbitMQ, Kafka) to handle the data flow.
- Insert the street data into a database using a consumer.

Tech Stack
- **Queueing Platform**: RabbitMQ - simple FIFO queue with only one consumer
- **Database**: PostgreSQL - relation database with data model for streets, small and simple implementation to hold the street's references.
  
Project Structure
- `StreetsService.ts`: Service for fetching street names via API, publishing and receiving messages to and from queue and creating tables.
- `cities.ts`: Contains a list of Israeli cities to process.
- `producer.ts`: Reads cities, fetches street data, and pushes to the queue.
- `consumer.ts`: Listens to the queue and inserts street data into the database.

Assumptions, Data Processing Rules and Key Features:
- There is only one consumer responsible for pulling messages from the queue.
- It's important to ensure data consistency—each piece of data should exist only once (i.e., no duplicates).
- Since there are multiple entities (e.g., cities, streets), and relationships between them are important, the data should be separated into distinct entities in the database.
- Street data is stored in separate tables/entities, structured according to their business context (e.g., cities, streets, etc.).
- The producer responsible to manage the city_name which will configure to pull the streets
- The consumer works in the background and listen to the messages' queue while saving the data on new message.

