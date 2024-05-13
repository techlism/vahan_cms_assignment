import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { Client } from 'pg' ;


dotenv.config();
const port = process.env.PORT || 10000;
const app = express();
app.use(express.json());
app.use(cors());
const SQL = new Client({connectionString : process.env.POSTGRES_URL});

SQL.connect().then(()=>console.log('Connected to Postgres Database')).catch((error)=>{throw error});

async function executeQuery(queryString : string) {
    const result = await SQL.query(queryString);
    return result;
}

app.get('/', (req,res)=>{
    return res.send("Root route. Working !!!");
})

app.post('/create-entity', async (req, res) => {
    const { tableName, columnsWithConstrainsts } : {tableName : string, columnsWithConstrainsts : string[]} = req.body;
  
    if (!tableName || !columnsWithConstrainsts) {
      return res.status(400).json({ error: 'tableName and columnsWithConstrainsts are required' });
    }

    try {
        const columnsString = columnsWithConstrainsts.join(', ');
        const queryString = `CREATE TABLE IF NOT EXISTS ${tableName} (${columnsString})`;
        const result = await executeQuery(queryString);        
        // console.log(result);
        return res.status(200).json({success : "Table created successfully"});
    } catch (error : any) {
        console.trace(error);
        if(error?.message) {
            return res.status(500).send(error.message);
        }
        return res.sendStatus(500);
    }
});

app.get('/get-entity-rows', async (req, res) => {
    const tableName = req.query.entity as string;
    
    if (!tableName) {
      return res.sendStatus(400);
    }

    try {
        const queryString = `SELECT * FROM ${tableName}`;
        const result = await executeQuery(queryString);        
        return res.status(200).json(result.rows);
    } catch (error) {
        console.trace(error);
        return res.sendStatus(500);
    }
});

app.post('/add-data-row-to-entity', async (req, res) => {
    const { tableName, data } : {tableName : string, data : {[key: string]: string}} = req.body;
  
    if (!tableName || !data) {
      return res.status(400).json({ error: 'tableName and data are required' });
    }
  
    try {
      const columnsString = Object.keys(data).join(', ');
      const valuesString = Object.values(data).map(value => `'${value}'`).join(', ');
      const queryString = `INSERT INTO ${tableName} (${columnsString}) VALUES (${valuesString})`;
      const result = await executeQuery(queryString);        
      // console.log(result);
      if(result.rowCount !== null && result.rowCount > 0) {
        return res.status(200).json({success : "Data added successfully"});
      }
      else{
        throw new Error('Unable to add. Check if table name is correct and data is in format');
      }
    } catch (error : any ) {
      if(error?.message){
        return res.status(500).send(error.message);
      }        
      res.sendStatus(500);
      console.trace(error);
    }
});

app.get('/get-schema', async (req, res) => {
    // url/get-schema?entity=users
    const tableName = req.query.entity as string;
    
    if (!tableName) {
      return res.sendStatus(400);
    }

    try {
        const queryString = `
        SELECT 
            column_name, 
            data_type, 
            character_maximum_length, 
            is_nullable, 
            column_default 
        FROM 
            information_schema.columns 
        WHERE 
            table_name = '${tableName}'`;
        const result = await executeQuery(queryString);   
        if(result.rowCount !== null && result.rowCount === 0) {
            return res.sendStatus(404); // no table found
        }
        // console.log(result?.rows);
        return res.status(200).json(result?.rows); // table with data types
    } catch (error) {
        console.trace(error);
        return res.sendStatus(500);
    }
})

// To update a particular row in a table
app.put('/update-entity-row', async (req, res) => {
    const { tableName, data, primaryKeyValue } : {tableName : string, data : string[], primaryKeyValue : string} = req.body;
    if(!tableName || !data || !primaryKeyValue){
        return res.sendStatus(400);
    }
    try {
        const columnsString = data.join(', ');    
        const queryString = `
            SELECT a.attname as column_name
            FROM   pg_index i
            JOIN   pg_attribute a ON a.attrelid = i.indrelid
                                    AND a.attnum = ANY(i.indkey)
            WHERE  i.indrelid = '${tableName}'::regclass
            AND    i.indisprimary;
        `;
        const result = await executeQuery(queryString);        
        if(result.rowCount !== null && result.rowCount > 0){
            const primaryKeyName = result?.rows[0].column_name;
            const newQueryString = `UPDATE ${tableName} SET ${columnsString} WHERE ${primaryKeyName} = ${primaryKeyValue}`;
            const newResult = await executeQuery(newQueryString);   
            if(newResult.rowCount === 0){
                return res.sendStatus(404);
            }
            else{
                // console.log(newResult);
                return res.status(200).json({success : "Data updated successfully"});     
            }
        }
        else{
            return res.sendStatus(404);
        }
    } catch (error) {
        console.trace(error);
        return res.sendStatus(500);        
    }
});

// to delete a single row from a table/entity
app.delete('/delete-entity-row', async (req, res) => {
    const tableName = req.query.entity as string;
    const primaryKeyValue = req.query.primaryKeyValue as string;
    if(!tableName || !primaryKeyValue){
        return res.sendStatus(400);
    }
    try {
        const queryString = `
            SELECT a.attname as column_name
            FROM   pg_index i
            JOIN   pg_attribute a ON a.attrelid = i.indrelid
                                    AND a.attnum = ANY(i.indkey)
            WHERE  i.indrelid = '${tableName}'::regclass
            AND    i.indisprimary;
        `;

        const result = await executeQuery(queryString);       
        console.log(result) ;
        if(result.rowCount !== null && result.rowCount > 0){
            const primaryKeyName = result?.rows[0].column_name;
            const newQueryString = `DELETE FROM ${tableName} WHERE ${primaryKeyName} = ${primaryKeyValue}`;
            const newResult = await executeQuery(newQueryString);   
            if(newResult.rowCount === 0){
                return res.sendStatus(404);
            }
            else{
                console.log(newResult);
                return res.status(200).json({success : "Data deleted successfully"});
            }
        }
        else{
            return res.sendStatus(404);
        }
    } catch (error) {
        console.trace(error);
        return res.sendStatus(500);
    }
});

// get primary key
app.get('/get-primary-key',async (req,res)=>{
    const tableName = req.query.entity as string;
    if(!tableName) return res.sendStatus(400);
    try {
        const queryString = `
        SELECT a.attname as column_name
        FROM   pg_index i
        JOIN   pg_attribute a ON a.attrelid = i.indrelid
                                AND a.attnum = ANY(i.indkey)
        WHERE  i.indrelid = '${tableName}'::regclass
        AND    i.indisprimary;
    `;

    const result = await executeQuery(queryString); 
    if(result.rowCount !== null && result.rowCount > 0 ){
        res.status(200).json({primaryKey : result.rows[0].column_name});        
    }
    else {
        res.sendStatus(404);
    }
    } catch (error: any) {
        if(error?.message){
            res.status(500).send(error.message);
        }
        res.sendStatus(500);
        console.trace(error);
        return;
    }
});


app.get('/all-entities',async (req,res)=>{
    try {
        const queryString = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public';` ;
        const result = await executeQuery(queryString);
        // console.log(result)
        if(result.rowCount !== null && result.rowCount > 0){
            return res.status(200).json(result.rows);
        }
        else return res.sendStatus(500);
    } catch (error : any) {
        if(error?.message){
            return res.status(500).send(error.message);
        }
        console.trace(error);
        return res.sendStatus(500);
    }
})

app.all('*', (req, res) => {
    res.status(404).send('Invalid route/method');
});
  

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// From - https://github.com/techlism