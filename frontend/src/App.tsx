import { PlusIcon, ChevronRight, X, MinusIcon, ChevronDown } from "lucide-react";
import {  useState } from "react";
import axios from 'axios';
import EntityTable from "./components/EntityTable";
import { Attribute, AttributeConstraint, AttributeType, SchemaField } from "./utils/types";
import { mapDataTypeToInputType } from "./utils/functions";
import { baseURL } from "./utils/constants";
import EntityList from "./components/EntityList";

export default function App() {
  const [showcreateEntityDialog, setShowCreateEntityDialog] = useState(false);
  const [inputFields, setInputFields] = useState<Attribute[]>([]);
  const [entityName, setEntityName] = useState<string>('');
  const [primaryKeyIndex, setPrimaryKeyIndex] = useState<null | number>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [entityList, setEntityList] = useState<string[]>([]);
  const [showEntityListDialog, setShowEntityListDialog] = useState(false);
  const [schema, setSchema] = useState<SchemaField[]>([]);
  const [showManageEntityDialog, setShowManageEntityDialog] = useState(false);
  const [showCreateNewRowForm, setShowCreateNewRowForm] = useState(false);
  const [showAllRows, setShowAllRows] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [allRows, setAllRows] = useState<Array<{ [key: string]: string | number | Date | boolean }>>([]);

  async function fetchAllRows() {
  
    try {
      const response = await axios.get(`${baseURL}/get-entity-rows?entity=${selectedEntity}`);
      if(response.data){
        const rows : Array<{ [key: string]: string | number | Date | boolean }> = response.data;
        setAllRows(rows);
        setShowAllRows(true);
      }
    } catch (error) {
      console.log(error);
    }
  }
  
  async function fetchSchema(entityName: string) {
    if(entityName === '') return;
    setSelectedEntity(entityName);
    try {
      const response = await axios.get(`${baseURL}/get-schema?entity=${entityName}`);
      if(response.data){
        const schema : SchemaField[] = response.data;        
        setSchema(schema);
      }
      console.log(schema);
    } catch (error) {
      console.log(error);
    }
  }

  async function fetchEntities() {
    try {
      const response = await axios.get(`${baseURL}/all-entities`);
      if(response.data){
        const entities : [] = response.data;
        if(entities.length > 0){
          entities.forEach((entity: any) => {
            setEntityList((currState) => Array.from(new Set([...currState, entity?.table_name])));
          })
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function handleEntityListVisibility() {
    setShowEntityListDialog((currState) => !currState);
    if(!showEntityListDialog || entityList.length === 0){
      await fetchEntities();
    }
    setShowCreateEntityDialog(false);
    setShowManageEntityDialog(false);
  }

  function handleCreateEntityBoxVisibility() {
    setShowCreateEntityDialog((currState) => !currState);
    setShowEntityListDialog(false);
    setShowManageEntityDialog(false);
  }

  async function handleManageEntityVisibility() {
    setShowEntityListDialog(false);
    setShowCreateEntityDialog(false);
    if(entityList.length === 0){
      await fetchEntities();
    }
    setShowManageEntityDialog((currState) => !currState);
  }

  function createNewAttribute() {
    setInputFields((currState) => [...currState, { name: '', type: AttributeType.VARCHAR, constraint: AttributeConstraint.NONE, isPrimaryKey: false }]);
  }
 

  function handleAttributeChange(index: number, field: keyof Attribute, value: string | boolean) {
    setInputFields((currState) => {
      const newState = [...currState];
      if (field === 'isPrimaryKey') {
        newState[index][field] = value as boolean;
        setPrimaryKeyIndex(value as boolean ? index : null);
      } else {
        if (field === 'type' && Object.values(AttributeType).includes(value as AttributeType)) {
          newState[index][field] = value as AttributeType;
        } else if (field === 'constraint' && Object.values(AttributeConstraint).includes(value as AttributeConstraint)) {
          newState[index][field] = value as AttributeConstraint;
        } else if (field === 'name') {
          newState[index][field] = String(value).toLowerCase();
        }
      }
      return newState;
    });    
  }

  function removeAttribute() {
    setInputFields((currState) => currState.filter((_, i) => i !== currState.length - 1));
  }

  async function submitAndCreateEntity(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if(entityName === '') {
      setErrorMsg('Entity Name is required');
      setTimeout(() => { setErrorMsg('') }, 3000);
      return;
    }
    if(inputFields.length === 0) {
      setErrorMsg('At least one attribute is required');
      setTimeout(() => { setErrorMsg('') }, 3000);
      return;
    }
    if(primaryKeyIndex === null) {
      setErrorMsg('Primary Key is required');
      setTimeout(() => { setErrorMsg('') }, 3000);
      return;
    }
    inputFields.forEach((field) => {
      if(field.name === '') {
        setErrorMsg('Attribute Name is required');
        setTimeout(() => { setErrorMsg('') }, 3000);
        return;
      }
    });
    const columnsWithConstraints = inputFields.map((field, index) => {
      let column = `${field.name} ${field.type}`;
      if (field.constraint) {
        column += ` ${field.constraint}`;
      }
      if (index === primaryKeyIndex) {
        column += ' PRIMARY KEY';
      }
      return column;
    });
  
    try {
      const response = await axios.post(`${baseURL}/create-entity`, {"tableName": entityName, "columnsWithConstrainsts": columnsWithConstraints});
      if(response.data?.success){
        setSuccessMsg('Entity Created Successfully');
        setTimeout(() => {
          setSuccessMsg('');
        }, 3000);
      }
    } catch (error) {
      setErrorMsg('Error Creating Entity');
      setTimeout(() => {
        setErrorMsg('');
      }, 3000);
      console.log(error);
    }
  }

  function handleCreateNewRowFormVisibility() {
    setShowCreateNewRowForm((currState) => !currState);    
  }

  async function createNewRow(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data : {[key: string]: string} = {};
    formData.forEach((value, key) => {
      data[key] = value as string;
    });
    console.log(data);
    try {
      const response = await axios.post(`${baseURL}/add-data-row-to-entity`, {"tableName": selectedEntity, "data": data});
      console.log(response);
      if(response.data?.success){
        await fetchAllRows();
        setSuccessMsg('Row Created Successfully');        
        e.currentTarget.reset();
        setTimeout(() => {
          setSuccessMsg('');
        }, 3000);
      }
    } catch (error) {
      console.log(error);
      setErrorMsg('Error Creating Row');
      setTimeout(() => { setErrorMsg('') }, 3000);
    }
  }

  return (
    <main className="p-4 min-h-screen align-middle items-center flex justify-evenly">
      <div className="flex flex-col max-w-fit space-y-4">
        <button
          className="bg-primary border-none p-2 flex items-center rounded-lg font-semibold text-text hover:opacity-90"
          onClick={handleCreateEntityBoxVisibility}
        >
          {showcreateEntityDialog === true ? <X /> : <PlusIcon />} Create Entity
        </button>
        <button className="bg-primary border-none p-2 flex items-center rounded-lg font-semibold text-text hover:opacity-90" onClick={handleEntityListVisibility}>
          <ChevronRight /> Show Entities
        </button>
        <button className="bg-primary border-none p-2 flex items-center rounded-lg font-semibold text-text hover:opacity-90" onClick={handleManageEntityVisibility}>
          <ChevronRight /> Manage Entities
        </button>
      </div>
      <div className="w-1 bg-slate-200 h-[90vh] rounded-lg" />{" "}
      {/* Vertical Line */}
      <div className="grid grid-cols-1 items-center align-middle ">
        <div hidden={!showcreateEntityDialog} className="border rounded-lg p-4">
          {/* <button className='bg-red-500 border-none p-2 flex items-center rounded-lg font-semibold text-text' onClick={handleCreateEntityBoxVisibility}>
            <X/>
          </button> */}
          <div className="my-3">
            {errorMsg && <p className="text-red-500 font-medium text-lg">{errorMsg}</p>}
            {successMsg && <p className="text-green-500 font-medium text-lg">{successMsg}</p>}
          </div>
          <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => submitAndCreateEntity(e)} id="createEntityForm">
            <label htmlFor="entityName" className="font-medium mr-10">
              Entity Name
            </label>
            <input
              type="text"
              name="entityName"
              id="entityName"
              className="font-medium border p-2 rounded-lg w-full"
              placeholder="Name of Entity (lowercase).."
              onChange={(e) => setEntityName(e.target.value)}
            />
            <div className="flex flex-col">
              {inputFields.map((field, index) => (
                <div key={index} className="space-x-4 space-y-4">
                  <label
                    htmlFor={`attributeName${index}`}
                    className="font-medium"
                  >
                    Attribute Name
                  </label>
                  <input
                    type="text"
                    name={`attributeName${index}`}
                    id={`attributeName${index}`}
                    className="font-medium border p-2 rounded-lg "
                    placeholder="Name of Attribute (lowercase).."
                    onChange={(e) => handleAttributeChange(index, 'name' ,e.target.value)}
                  />
                  <label
                    htmlFor={`attributeType${index}`}
                    className="font-medium"
                  >
                    Attribute Type
                  </label>
                  <select
                    name={`attributeType${index}`}
                    id={`attributeType${index}`}
                    className="font-medium border p-2 rounded-lg "
                    onChange={(e) => handleAttributeChange(index, 'type', e.target.value)}
                  >
                    {/* <option value="">None</option> */}
                    <option value="VARCHAR">VARCHAR</option>
                    <option value="INTEGER">INTEGER</option>
                    <option value="TEXT">TEXT</option>
                    <option value="BOOLEAN">BOOLEAN</option>
                    {/* <option value="TIMESTAMP">TIMESTAMP</option> */}
                    <option value="DATE">DATE</option>
                    <option value="FLOAT">FLOAT</option>        
                  </select>
                  <label
                    htmlFor={`attributeConstraint${index}`}
                    className="font-medium"
                  >
                    Attribute Constraint
                  </label>
                  <select
                    name={`attributeConstraint${index}`}
                    id={`attributeConstraint${index}`}
                    className="font-medium border p-2 rounded-lg "
                    onChange={(e) => handleAttributeChange(index, 'constraint', e.target.value)}
                  >
                    <option value="">None</option>
                    <option value="UNIQUE">UNIQUE</option>
                    <option value="NOT NULL">NOT NULL</option>
                    <option value="NOT NULL UNIQUE">NOT NULL UNIQUE</option>
                  </select>
                  <label
                    htmlFor={`isPrimaryKey${index}`}
                    className="font-medium"
                  >
                    Is Primary Key?
                  </label>
                  <input
                    type="checkbox"
                    name={`isPrimaryKey${index}`}
                    id={`isPrimaryKey${index}`}
                    className="font-medium border p-2 rounded-lg "
                    onChange={(e) => handleAttributeChange(index, 'isPrimaryKey', e.target.checked)}
                    disabled={primaryKeyIndex !== null && primaryKeyIndex !== index}
                  />
                </div>
              ))}
            </div>
          </form>
          <div className="grid grid-cols-3 gap-4 mt-4 max-w-fit">
            <button
              className="bg-primary border-none p-2 flex items-center justify-center rounded-lg font-semibold text-text"
              onClick={createNewAttribute}
            >
              <PlusIcon /> Add Attribute
            </button>
            <button
              className="bg-primary border-none p-2 flex items-center justify-center rounded-lg font-semibold text-text"
              onClick={removeAttribute}
            >
              <MinusIcon /> Remove Attribute
            </button>
            <button
              className="bg-primary border-none p-2 flex items-center justify-center rounded-lg font-semibold text-text"
              form="createEntityForm"
              type="submit"
            >
              Create Entity
            </button>            
          </div>
        </div>
        {/* ---------------------------- Show ENTITY BOX */}
        <EntityList entityList={entityList} showEntityListDialog={showEntityListDialog} showcreateEntityDialog={showcreateEntityDialog} showManageEntityDialog={showManageEntityDialog} />
        {/* ---------------------------- Manage Entity */}
        <div className="border p-4 rounded-lg space-y-4 w-full" hidden={!showManageEntityDialog}>
          <div className="mx-4">
            {errorMsg && <p className="text-red-500 font-medium text-lg">{errorMsg}</p>}
            {successMsg && <p className="text-green-500 font-medium text-lg">{successMsg}</p>}
          </div>
          <h1 className="font-semibold text-xl" >
            Manage Entity
          </h1>
          {/* Select Schema */}
          {/* <form action=""> */}
          <div>
            <label htmlFor="entityName" className="font-medium text-gray-600">
                Select Entity
              </label>
              <select
                name="entityName"
                id="entityName"
                className="font-medium border p-2 rounded-lg w-full"
                onChange={(e) => fetchSchema(e.target.value)}
              >
                <option value="">Select Entity</option>
                {
                  entityList.map((entity, index) => (
                    <option key={index} value={entity}>{entity}</option>
                  ))
                }
              </select>
          </div>
          <div className="flex gap-4">
            <button className="bg-primary border-none p-2 flex items-center rounded-lg font-semibold text-text hover:opacity-90 mt-4 disabled:opacity-30" onClick={fetchAllRows} disabled={selectedEntity === ''}>
              <ChevronDown/>Show All Rows
            </button>
            <button className="bg-primary border-none p-2 flex items-center rounded-lg font-semibold text-text hover:opacity-90 mt-4 disabled:opacity-30" onClick={handleCreateNewRowFormVisibility} disabled={selectedEntity === ''}>
              <PlusIcon/>Create New Row
            </button>

          </div>
          {/* </form> */}
          <form onSubmit={createNewRow} hidden={!showCreateNewRowForm} className="border rounded-lg p-2">
            {
              schema.map((field, index) => (
                <div key={index}>
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
                  />
                </div>
              ))
            }
            <button type="submit" className="bg-primary border-none p-2 flex items-center rounded-lg font-semibold text-text hover:opacity-90 mt-4">
              Submit
            </button>            
          </form>
          
          {showAllRows && <EntityTable rows={allRows} schema={schema} selectedEntity={selectedEntity} setAllRows={setAllRows} fetchAllRows={fetchAllRows}/>}


        </div>
      </div>      
    </main>
  );
}
