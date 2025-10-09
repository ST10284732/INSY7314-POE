# Steps to follow when running the program #
## 1. Backend Steps: ##

1. Create a new terminal
2. cd backend
3. npm install
4. Inside the backend folder created a new file named '.env'
4.1 Inside .env file add the following content:
PORT = 3000
CONN_STRING = (Your mongodb database connection string here)
JWT_SECRET=yourSuperSecretKeyHere
5. nodemon app.js
6. You should see somthing along the lines of: 
"API listening on port 3000
Connected to the database successfully."

## 2. Frontend Steps: ##
1. create another new terminal (keep the backend one open)
2. cd frontend
3. npm install
4. npm run dev
5. press the url link provided and the website should open 
