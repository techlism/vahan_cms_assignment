import { PencilLineIcon, Trash2, X } from "lucide-react";
import { useState } from "react";
import axios from "axios";
import { mapDataTypeToInputType } from "../utils/functions";
import { baseURL } from "../utils/constants";
import { SchemaField } from "../utils/types";

export default function EntityTable({rows, schema, selectedEntity, setAllRows, fetchAllRows}:{rows : Array<{ [key: string]: string | number | Date | boolean }>, schema : SchemaField[], selectedEntity : string, setAllRows: React.Dispatch<React.SetStateAction<Array<{ [key: string]: string | number | Date | boolean }>>>, fetchAllRows : () => Promise<void> } ) {
    const [primaryKey, setPrimaryKey] = useState<string>('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingRowIndex, setEditingRowIndex] = useState<number>(-1);
    const [statusMsg, setStatusMsg] = useState<string>(''); 
    const [currentRow, setCurrentRow] = useState<{ [key: string]: string | number | Date | boolean }>({});
    if(rows.length === 0){
        return null;
    }
    async function getPrimaryKey() {
        try {
            const response = await  axios.get(`${baseURL}/get-primary-key?entity=${selectedEntity}`) ;
            if(response?.data?.primaryKey){
                setPrimaryKey(response.data.primaryKey);
            }
        } catch (error) {
            console.log(error);
        }                
    }
    async function deleteRow(rowIndex : number) { // Working
        const row = rows[rowIndex];
        if(primaryKey === ''){
            await getPrimaryKey();
        }
        const primaryKeyValue = row[primaryKey];
        try {
            const response = await axios.delete(`${baseURL}/delete-entity-row?entity=${selectedEntity}&primaryKeyValue=${primaryKeyValue}`);
            if(response.status === 200){
                setAllRows((prevRows) => {
                    const newRows = [...prevRows];
                    newRows.splice(rowIndex, 1);
                    return newRows;
                });
                setStatusMsg('Row deleted successfully');
                setTimeout(() => {
                    setStatusMsg('');
                }, 2000);
            }            
        } catch (error) {
            console.log(error);
        }
    }

    async function updateRow(row : {[key: string]: string}, rowIndex : number) {
        if(primaryKey === ''){
            await getPrimaryKey();
        }
        const primaryKeyValue = rows[rowIndex][primaryKey];
        try {           
            const response = await axios.put(`${baseURL}/update-entity-row`,{"tableName":selectedEntity,"primaryKeyValue":primaryKeyValue,"data":row});
            console.log(response);
            if(response.status === 200){
                await fetchAllRows();
                setStatusMsg('Row updated successfully');
                setTimeout(() => {
                    setStatusMsg('');
                }, 2000);
            }            
        } catch (error) {
            console.log(error);
        }
    }
    
    async function openEditDialog(rowIndex : number) {
        if(editingRowIndex !== -1){
            setEditingRowIndex(-1);
        }
        setEditingRowIndex(rowIndex);
        setCurrentRow(rows[rowIndex]);
        if(primaryKey === ''){
            await getPrimaryKey();
        }     
        setDialogOpen(true);   
    }
    
    async function submitEditDialog(event : React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const row : {[key: string]: string} = {};
        formData.forEach((value, key) => {
          row[key] = value as string;
        });
        await updateRow(row, editingRowIndex);
        setDialogOpen(false);
        event?.currentTarget?.reset();
    }

    function handleDialogClose() {
        setDialogOpen(false);
        setEditingRowIndex(-1);
    }
    
    return (
        <div>
            {statusMsg && <p className="p-4 m-4 bg-slate-200 rounded-lg font-semibold text-lg">{statusMsg}</p>}
            <table className="table-auto border-collapse border border-gray-300">
            <thead>
                <tr>
                {schema.map((field, index) => (
                    <th key={index} className="border border-gray-300 px-2 py-1">
                    {field.column_name}
                    </th>
                ))}
                <th className="border border-gray-300 px-2 py-1">Actions</th>
                </tr>
            </thead>
            <tbody>
                {rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                        {schema.map((field, index) => (
                        <td key={index} className="border border-gray-300 px-2 py-1">
                            {String(row[field.column_name])}
                        </td>
                        ))}
                        <td className="border border-gray-300 px-2 py-2 flex gap-4">
                        <button className="bg-primary border-none p-2 flex items-center rounded-lg font-semibold text-text hover:opacity-90" onClick={()=>openEditDialog(rowIndex)}> <PencilLineIcon/> </button>                    
                        <button className="bg-red-600 border-none p-2 flex items-center rounded-lg font-semibold text-text hover:opacity-90" onClick={() => deleteRow(rowIndex)}> <Trash2/> </button>
                        </td>
                    </tr>
                ))}
            </tbody>
            </table>
            <div className={`border rounded-lg mt-4 ${dialogOpen === true ? 'visible' : 'hidden' } `} >
                <div className="text-center m-4 flex align-middle items-center">
                    <button className="bg-red-400 border-none p-1 mr-1 flex items-center rounded-lg font-semibold text-text hover:opacity-90" onClick={handleDialogClose}> <X/> </button>
                    <p>PrimaryKey values cannot be modified.</p>
                </div>
                <form className="flex flex-col gap-4 p-4" onSubmit={submitEditDialog}>
                    {
                        schema.map((field, index) => (
                            <div key={index+"editing_window"}>
                            <label htmlFor={field.column_name} className="font-medium mr-10">
                                {field.column_name}
                            </label>
                            <input
                                type={mapDataTypeToInputType(field.data_type)}
                                id={field.column_name}
                                name={field.column_name}
                                className="font-medium border p-2 rounded-lg w-full"
                                required={field.is_nullable === 'NO'}
                                placeholder={field.data_type}
                                defaultValue={editingRowIndex === -1 ? '' : String(currentRow[field.column_name])}
                                disabled={field.column_name === primaryKey}
                            />
                            </div>
                        ))
                    }
                    <button className="bg-primary border-none p-2 flex items-center rounded-lg font-semibold text-text hover:opacity-90 justify-center" type="submit">Save</button>
                </form>
            </div>
        </div>
    );
}