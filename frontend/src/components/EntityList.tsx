export default function EntityList({entityList, showEntityListDialog, showcreateEntityDialog, showManageEntityDialog }: {entityList: string[], showEntityListDialog: boolean, showcreateEntityDialog: boolean, showManageEntityDialog: boolean}){
    return(
        <div className="border p-4 rounded-lg" hidden={!showEntityListDialog || showcreateEntityDialog || showManageEntityDialog }>
            <h1 className="font-semibold text-lg">
            Entities List
            </h1>
            {
            entityList.map((entity, index) => (
                <div key={index} className="flex items-center justify-between border-b p-2">
                <p className="font-medium">{entity}</p>
                </div>
            ))
            }
        </div>
    );
}