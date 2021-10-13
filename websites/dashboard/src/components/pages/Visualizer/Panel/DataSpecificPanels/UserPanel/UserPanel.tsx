import React, { FC } from "react";
import { User } from "../../../../../../api/tools/shared-tools/endpoints-interfaces/user";
import GenericPropertiesTable, {
   PropsGenericPropertiesTable
} from "../GenericPropertiesTable/GenericPropertiesTable";

const UserPanel: FC<PropsGenericPropertiesTable> = props => {
   const user = (props.properties as unknown) as Partial<User>;

   return (
      <>
         User panel
         <GenericPropertiesTable properties={user as Record<string, string | number>} />
      </>
   );
};

export default UserPanel;
