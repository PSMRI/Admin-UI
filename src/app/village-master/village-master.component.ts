/*
* AMRIT – Accessible Medical Records via Integrated Technology 
* Integrated EHR (Electronic Health Records) Solution 
*
* Copyright (C) "Piramal Swasthya Management and Research Institute" 
*
* This file is part of AMRIT.
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License
* along with this program.  If not, see https://www.gnu.org/licenses/.
*/
import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { dataService } from '../services/dataService/data.service';
import { ConfirmationDialogsService } from './../services/dialog/confirmation.service';
import { VillageMasterService } from './../services/adminServices/AdminVillage/village-master-service.service';
import { MdDialog, MdDialogRef } from '@angular/material';
import { MD_DIALOG_DATA } from '@angular/material';
import { TitleCasePipe } from '@angular/common'
import { NgForm } from '@angular/forms';

declare let jQuery: any;

@Component({
    selector: 'app-village-master',
    templateUrl: './village-master.component.html'
})
export class VillageMasterComponent implements OnInit {

    filteredavailableVillages: any = [];
    showVillages: any = true;
    availableVillages: any = [];
    data: any;
    providerServiceMapID: any;
    provider_states: any = [];
    provider_services: any;
    service_provider_id: any;
    editable: any = false;
    availableVillageNames: any = [];
    countryID: any;
    createdBy: any;


    showTableFlag: boolean = false;
    showFormFlag: boolean = false;
    disable_flag: boolean = false;
    @ViewChild('villageForm') villageForm: NgForm;
    constructor(
        public commonDataService: dataService,
        private alertMessage: ConfirmationDialogsService,
        private villageMasterService: VillageMasterService,
        public dialog: MdDialog) {
        this.data = [];
        this.service_provider_id = this.commonDataService.service_providerID;
        this.countryID = 1; // hardcoded as country is INDIA
        this.createdBy = this.commonDataService.uname;
    }

    showForm() {
        // this.showVillages = false;
        this.showTableFlag = false;
        this.showFormFlag = true;
        this.disable_flag = true;
    }
    ngOnInit() {
        this.getStates();
        //this.getServiceLines();
    }

    getStates() {
        this.villageMasterService.getStates(this.countryID).subscribe(response => this.getStatesSuccessHandeler(response));
    }

    getStatesSuccessHandeler(response) {
        this.provider_states = response;
    }

    districts: any = [];
    getDistricts(stateID) {
        this.villageMasterService.getDistricts(stateID).subscribe(response => this.getDistrictsSuccessHandeler(response));
    }
    getDistrictsSuccessHandeler(response) {
        this.availableVillages = [];
        this.filteredavailableVillages = [];
        this.taluks = [];
        this.searchDistrictID = undefined;
        this.districts = response;
        console.log(this.districts)
    }

    taluks: any = [];
    GetTaluks(districtID: number) {
        this.villageMasterService.getTaluks(districtID)
            .subscribe(response => this.SetTaluks(response));
    }
    SetTaluks(response: any) {
        this.taluks = response;
        this.availableVillages = [];
        this.filteredavailableVillages = [];
        this.searchTalukID = undefined;
    }

    GetBranches(talukID: number) {
        let data = { "blockID": talukID };
        this.villageMasterService.getBranches(data)
            .subscribe(response => this.SetBranches(response));
    }
    SetBranches(response: any) {
        this.availableVillageNames=[];
        this.availableVillages = [];
        this.filteredavailableVillages=[]

        this.availableVillages = response;
        this.filteredavailableVillages = response;
        this.showTableFlag = true;

        for (let villages of this.availableVillages) {
            this.availableVillageNames.push(villages.blockID + "-" + villages.villageName.toUpperCase());
        }
    }

    villageNameExist: any = false;
    checkExistance(blockID, villageName) {
        this.villageNameExist = this.availableVillageNames.includes(blockID + "-" + villageName.toUpperCase());
        console.log(this.villageNameExist);
    }

    villageObj: any;
    villageList: any = [];
    addVillageToList(values) {

        if (values.villageName !== undefined && values.villageName !== null && (values.villageName.trim() === ''))
            this.alertMessage.alert('Please enter valid Village');
        else{
        // for(let services of values.serviceID){
        this.villageObj = {};

        // if(values.blockID!=undefined){
        this.villageObj.blockID = this.searchTalukID;
        // this.villageObj.blockName = values.blockID.split("-")[1];
        // }
        this.villageObj.panchayatName = values.panchayatName;
        this.villageObj.villageName = (values.villageName !== undefined && values.villageName !== null) ? values.villageName.trim() : null;
        this.villageObj.habitat = values.habitat;
        this.villageObj.pinCode = values.pinCode;
        this.villageObj.govVillageID = values.govVillageID;
        this.villageObj.govSubDistrictID = values.govSubDistrictID;
        this.villageObj.isRural = values.isRural;

        this.villageObj.createdBy = this.createdBy;
        this.checkDuplicates(this.villageObj);
        console.log("this.villageObj", this.villageObj);
        }

    }
    checkDuplicates(object) {
        let duplicateStatus = 0
        if (this.villageList.length === 0) {
            this.villageList.push(object);
        }
        else {
            for (let i = 0; i < this.villageList.length; i++) {
                if (this.villageList[i].villageName.toUpperCase() === object.villageName.toUpperCase()
                    && this.villageList[i].pinCode === object.pinCode) {
                    duplicateStatus = duplicateStatus + 1;
                    console.log("this.duplicateStatus", duplicateStatus);
                }
            }
            if (duplicateStatus === 0) {
                this.villageList.push(object);
            }
            else {
                this.alertMessage.alert("Already exists");
            }
        }
    }
    removeObj(index) {
        this.villageList.splice(index, 1);
    }

    storeVillages() {
        console.log(this.villageList);
        let obj = { "districtBranchMapping": this.villageList };
        this.villageMasterService.storeVillages(JSON.stringify(obj)).subscribe(response => this.successHandler(response));
    }

    successHandler(response) {
        this.alertMessage.alert("Saved successfully", 'success');
        this.villageForm.resetForm();
        this.showFormFlag = false;
        this.disable_flag = false;
        this.villageList = [];
        this.GetBranches(this.searchTalukID);
    }

    back() {
        this.alertMessage.confirm('Confirm', "Do you really want to cancel? Any unsaved data would be lost").subscribe(res => {
            if (res) {
                jQuery("#villageForm").trigger("reset");
                this.villageList = [];
                this.showTableFlag = true;
                this.showFormFlag = false;
                this.disable_flag = false;
            }
        })
    }



    dataObj: any = {};
    updateVillageStatus(village) {
        let flag = !village.deleted;
        let status;
        if (flag === true) {
            status = "Deactivate";
        }
        if (flag === false) {
            status = "Activate";
        }

        this.alertMessage.confirm('Confirm', "Are you sure you want to " + status + "?").subscribe(response => {
            if (response) {
                this.dataObj = {};
                this.dataObj.districtBranchID = village.districtBranchID;
                this.dataObj.deleted = !village.deleted;
                this.dataObj.modifiedBy = this.createdBy;
                this.villageMasterService.updateVillageStatus(JSON.stringify(this.dataObj)).subscribe(response => this.updateStatusHandler(response));
                village.deleted = !village.deleted;
            }
            this.alertMessage.alert(status + "d successfully", 'success');
        });




    }
    updateStatusHandler(response) {
        console.log("Village status changed");
    }

    searchStateID: any;
    stateID: any;
    searchDistrictID: any;
    districtID: any;
    searchTalukID: any;
    districtBranchID: any;
    villageName: any;
    blockID: any;
    panchayatName: any;
    habitat: any;
    pinCode: any;
    govVillageID: any;
    govSubDistrictID: any;
    isRural: Boolean;

    initializeObj() {
        this.districtBranchID = "";
        this.villageName = "";
        this.blockID = "";
        this.panchayatName = "";
        this.habitat = "";
        this.pinCode = "";
        this.govVillageID = "";
        this.govSubDistrictID = "";
        this.isRural = false;
        

    }
    editVillageData(village) {

        if (this.searchStateID != "") {
            this.stateID = this.searchStateID;
        }
        if (this.searchDistrictID != "") {
            this.districtID = this.searchDistrictID;
        }
        this.districtBranchID = village.districtBranchID;
        this.blockID = village.blockID + "-" + village.blockName;
        this.panchayatName = village.panchayatName;
        this.villageName = village.villageName;
        this.habitat = village.habitat;
        this.pinCode = village.pinCode;
        this.govVillageID = village.govVillageID;
        this.govSubDistrictID = village.govSubDistrictID;
        this.isRural = village.isRural;
        
        
        //   } else {
        //      travelStatus: "false" ;
        //   }

        this.getDistricts(village.stateID);
        this.GetTaluks(this.searchDistrictID);

        this.editable = true;
    }

    updateVillageData(village) {
        this.dataObj = {};
        this.dataObj.districtBranchID = village.districtBranchID;
        if (village.blockID != undefined) {
            this.dataObj.blockID = village.blockID.split("-")[0];
            this.dataObj.blockName = village.blockID.split("-")[1];
        }
        this.dataObj.panchayatName = village.panchayatName;
        this.dataObj.villageName = village.villageName;
        this.dataObj.habitat = village.habitat;
        this.dataObj.pinCode = village.pinCode;
        this.dataObj.govVillageID = village.govVillageID;
        this.dataObj.govSubDistrictID = village.govSubDistrictID;
        this.dataObj.isRural = village.isRural;

        this.dataObj.modifiedBy = this.createdBy;
        this.villageMasterService.updateVillageData(this.dataObj).subscribe(response => this.updateHandler(response));

    }

    updateHandler(response) {
        this.editable = false;
        this.alertMessage.alert("Updated successfully", 'success');
        this.GetBranches(this.dataObj.blockID);

    }

    clearEdit() {
        //this.initializeObj();
        this.showVillages = true;
        this.editable = false;
    }

    clear() {
        // this.stateID = this.searchStateID;
        // this.districtID = this.searchDistrictID;
        jQuery("#searchFields").trigger("reset");

        this.showTableFlag = false;
        this.availableVillages = [];
        this.filteredavailableVillages = [];

        this.districts = [];
        this.taluks = [];
    }


    openEditModal(toBeEditedOBJ) {
        let obj = {
            "village_names": this.availableVillageNames,
            "edit_obj": toBeEditedOBJ
        }
        let dialog_Ref = this.dialog.open(EditVillageModal, {
            height: '400px',
            width: '700px',
            data: obj
        });

        dialog_Ref.afterClosed().subscribe(result => {
            console.log(`Dialog result: ${result}`);
            if (result === "success") {
                this.GetBranches(this.searchTalukID);
            }

        });

    }
    filterComponentList(searchTerm?: string) {
        if (!searchTerm) {
            this.filteredavailableVillages = this.availableVillages;
        } else {
            this.filteredavailableVillages = [];
            this.availableVillages.forEach((item) => {
                for (let key in item) {
                    if (key == 'villageName' || key == 'panchayatName' || key == 'govVillageID' || key == 'pinCode' || key == 'govSubDistrictID' || key =='isRural') {
                        let value: string = '' + item[key];
                        if (value.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0) {
                            this.filteredavailableVillages.push(item); break;
                        }
                    }
                }
            });
        }
    }
}


@Component({
    selector: 'edit-village',
    templateUrl: './editVillageModal.html'
})
export class EditVillageModal {

    blockID: any;
    oldVillageName: any;
    villageExist: boolean = false;
    village_names: any = [];

    districtBranchID: any;
    villageName: any;
    panchayatName: any;
    habitat: any;
    pinCode: any;
    govVillageID: any;
    govSubDistrictID: any;
    isRural: Boolean;
   

    dataObj: any;

    constructor(@Inject(MD_DIALOG_DATA) public data: any, public dialog: MdDialog,
        public villageMasterService: VillageMasterService,
        public commonDataService: dataService,
        private alertMessage: ConfirmationDialogsService,
        public dialogReff: MdDialogRef<EditVillageModal>) { }

    ngOnInit() {
        console.log("dialog data", this.data);

        this.districtBranchID = this.data.edit_obj.districtBranchID;
        this.villageName = this.data.edit_obj.villageName;
        this.panchayatName = this.data.edit_obj.panchayatName;
        this.habitat = this.data.edit_obj.habitat;
        this.pinCode = this.data.edit_obj.pinCode;
        this.govVillageID = this.data.edit_obj.govVillageID;
        this.govSubDistrictID = this.data.edit_obj.govSubDistrictID;
        this.isRural = this.data.edit_obj.isRural;
      
        this.blockID = this.data.edit_obj.blockID;

        this.oldVillageName = this.data.edit_obj.villageName;
        this.village_names = this.data.village_names;
    }

    checkExistance_edit(villageName) {
        if (villageName != this.oldVillageName) {
            this.villageExist = this.village_names.includes(this.blockID + "-" + villageName.trim().toUpperCase());

        }
        else {
            this.villageExist = false;
        }
        console.log(this.villageExist);
    }
    update(editedVillageData) {
        if (editedVillageData.villageName !== undefined && editedVillageData.villageName !== null && (editedVillageData.villageName.trim() === ''))
            this.alertMessage.alert('Please enter valid Village');
        else{
        this.dataObj = {};
        this.dataObj.districtBranchID = this.districtBranchID;
        //  if(village.blockID!=undefined){
        // this.dataObj.blockID = village.blockID.split("-")[0];
        // this.dataObj.blockName = village.blockID.split("-")[1];
        // }
        this.dataObj.panchayatName = editedVillageData.panchayatName;
        this.dataObj.villageName = (editedVillageData.villageName !== undefined && editedVillageData.villageName !== null) ? editedVillageData.villageName.trim() : null;
        this.dataObj.habitat = editedVillageData.habitat;
        this.dataObj.pinCode = editedVillageData.pinCode;
        this.dataObj.govVillageID = editedVillageData.govVillageID;
        this.dataObj.govSubDistrictID = editedVillageData.govSubDistrictID;
        this.dataObj.isRural = editedVillageData.isRural;

        this.dataObj.modifiedBy = this.commonDataService.uname;
        this.villageMasterService.updateVillageData(this.dataObj).subscribe(response => this.updateSuccessHandeler(response));
        }
    }

    updateSuccessHandeler(response) {
        console.log(response, "edit response success");
        if (response) {
            this.dialogReff.close("success");
            this.alertMessage.alert("Updated successfully", 'success');

        }
    }

}