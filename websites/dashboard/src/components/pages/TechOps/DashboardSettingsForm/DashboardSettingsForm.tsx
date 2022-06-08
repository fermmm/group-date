import LoadingButton from "@mui/lab/LoadingButton";
import { Checkbox, FormControlLabel, TextField } from "@mui/material";
import React, { ChangeEvent, FC, useState } from "react";
import { notificationStatusRequest } from "../../../../api/server/techOps";
import {
   getGlobalSettingValue,
   setGlobalSetting,
   SettingIds,
} from "../../../../common-tools/settings/global-settings";
import CardColumn from "../../../common/UI/CardColumn/CardColumn";
import { Tooltip } from "../../../common/UI/Tooltip/Tooltip";
import ResponseDisplay from "../ResponseDisplay/ResponseDisplay";

const DashboardSettingsForm: FC = props => {
   const [showDecoded, setShowDecoded] = useState<boolean>(getGlobalSettingValue("showDecoded"));

   const saveBooleanSetting = (settingName: SettingIds, newValue: boolean) => {
      setShowDecoded(newValue);
      setGlobalSetting(settingName, newValue);
   };

   return (
      <CardColumn>
         Dashboard global settings
         <Tooltip
            text={
               "In the database props are saved encoded using encodeURI(), the dashboard visualizer reads directly from database, so the data is not easy to read, enable this so the dashboard decodes the database values before showing them"
            }
            placement="bottom"
         >
            <FormControlLabel
               label={"Show props encoded in the visualizer panel"}
               control={
                  <Checkbox
                     checked={showDecoded}
                     onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        saveBooleanSetting("showDecoded", e.target.checked)
                     }
                     inputProps={{ "aria-label": "controlled" }}
                  />
               }
            />
         </Tooltip>
      </CardColumn>
   );
};

export default DashboardSettingsForm;
