`git clone https://github.com/techlism/vahan_cms_assignment.git`
<br/>
**FOR FRONTEND**
```
cd frontend
npm install
npm start
```
**FOR BACKEND**
```
cd backend
npm install
npm run dev or npm start
```
P.S. For backend to work you will need a postgres URL like this  `postgresql://vahan_cms_db_owner:********@ep-spring-flower-a1dyneq2.ap-southeast-1.aws.neon.tech/vahan_cms_db?sslmode=require` in your .env file present in backend directory.
Also Backend the hosted on render's free tier which is quite limited. It spin down quite quickly with inactivity.
