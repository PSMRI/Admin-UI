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
import { Component, OnInit, ViewChild } from '@angular/core';
import { ProviderAdminRoleService } from "../services/ProviderAdminServices/state-serviceline-role.service";
import { dataService } from '../services/dataService/data.service';
import { DrugMasterService } from '../services/ProviderAdminServices/drug-master-services.service';
import { ConfirmationDialogsService } from './../services/dialog/confirmation.service';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-drug-group',
  templateUrl: './drug-group.component.html'
})
export class DrugGroupComponent implements OnInit {

  filteredavailableDrugGroups: any = [];
  showDrugGroups: any = true;
  availableDrugGroups: any = [];
  data: any;
  providerServiceMapID: any;
  provider_states: any;
  provider_services: any;
  service_provider_id: any;
  showPaginationControls: any = true;
  editable: any = false;
  availableDrugGroupNames: any = [];
  serviceID104: any;
  createdBy: any;
  sno: any = 0;
  invalidDrugDesc = false;
  @ViewChild('drugGroupForm') drugGroupForm: NgForm;
  drugGroupToEdit: any;

  constructor(public providerAdminRoleService: ProviderAdminRoleService,
    public commonDataService: dataService,
    public drugMasterService: DrugMasterService,
    private alertMessage: ConfirmationDialogsService) {
    this.data = [];
    this.service_provider_id = this.commonDataService.service_providerID;
    this.serviceID104 = this.commonDataService.serviceID104;
    this.createdBy = this.commonDataService.uname;
  }

  ngOnInit() {
    this.getAvailableDrugs();
    this.getStatesByServiceID();

  }

  stateSelection(stateID) {
    this.getServices(stateID);
  }

  getAvailableDrugs() {
    this.drugGroupObj = {};
    this.drugGroupObj.serviceProviderID = this.service_provider_id;
    this.drugMasterService.getDrugGroups(this.drugGroupObj).subscribe(response => this.getDrugGroupsSuccessHandeler(response),
      (err) => {
        console.log("error", err);
        //this.alertMessage.alert(err, 'error')
      });
  }

  getDrugGroupsSuccessHandeler(response) {
    this.availableDrugGroups = response;
    this.filteredavailableDrugGroups = response;
    for (let availableDrugGroup of this.availableDrugGroups) {
      this.availableDrugGroupNames.push(availableDrugGroup.drugGroup);
    }
  }
  getServices(stateID) {
    this.providerAdminRoleService.getServices(this.service_provider_id, stateID).subscribe(response => this.getServicesSuccessHandeler(response),
      (err) => {
        console.log("error", err);
        //this.alertMessage.alert(err, 'error')
      });
  }

  getStates() {
    this.providerAdminRoleService.getStates(this.service_provider_id).subscribe(response => this.getStatesSuccessHandeler(response),
      (err) => {
        console.log("error", err);
        //this.alertMessage.alert(err, 'error')
      });
  }

  getStatesByServiceID() {
    this.drugMasterService.getStatesByServiceID(this.serviceID104, this.service_provider_id).subscribe(response => this.getStatesSuccessHandeler(response),
      (err) => {
        console.log("error", err);
        //this.alertMessage.alert(err, 'error')
      });
  }

  getStatesSuccessHandeler(response) {
    this.provider_states = response;
  }

  getServicesSuccessHandeler(response) {
    this.provider_services = response;
    for (let provider_service of this.provider_services) {
      if ("104" == provider_service.serviceName) {
        this.providerServiceMapID = provider_service.providerServiceMapID;
      }
    }
  }

  responseHandler(response) {
    this.data = response;
  }

  showForm() {
    this.showDrugGroups = false;
    this.inValidDrugGroup = false;
    this.invalidDrugDesc = false;
  }

  drugGroupObj: any;
  // = {
  // 	'drugGroup':'',
  //   'drugGroupDesc':'',
  //   'providerServiceMapID':'',
  //   'createdBy':''
  // };
  drugGroupList: any = [];

  addDrugGroupToList(values) {
    
      this.drugGroupObj = {};
      this.drugGroupObj.drugGroup = (values.drugGroup !== undefined && values.drugGroup !== null) ? values.drugGroup.trim() : null;
      this.drugGroupObj.drugGroupDesc = (values.drugGroupDesc !== undefined && values.drugGroupDesc !== null) ? values.drugGroupDesc.trim() : null;

      this.drugGroupObj.serviceProviderID = this.service_provider_id;
      this.drugGroupObj.createdBy = this.createdBy;
      this.checkDuplicates(this.drugGroupObj);
  }
  checkDuplicates(object) {
    let duplicateStatus = 0
    if (this.drugGroupList.length === 0) {
      this.drugGroupList.push(object);
    }
    else {
      for (let i = 0; i < this.drugGroupList.length; i++) {
        if (this.drugGroupList[i].drugGroup === object.drugGroup
        ) {
          duplicateStatus = duplicateStatus + 1;
        }
      }
      if (duplicateStatus === 0) {
        this.drugGroupList.push(object);
      }
      else {
        this.alertMessage.alert("Already exists");
      }
    }
  }
  storeDrugGroup() {
    let obj = { "drugGroups": this.drugGroupList };
    this.drugMasterService.saveDrugGroups(JSON.stringify(obj)).subscribe(response => this.successHandler(response));
  }

  successHandler(response) {
    this.drugGroupList = [];
    this.alertMessage.alert("Saved successfully", 'success');
    this.getAvailableDrugs();
    this.clearEdit();
  }
  dataObj: any = {};
  updateDrugGroupStatus(drugGroup) {
    let flag = !drugGroup.deleted;
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
        this.dataObj.drugGroupID = drugGroup.drugGroupID;
        this.dataObj.deleted = !drugGroup.deleted;
        this.dataObj.modifiedBy = this.createdBy;
        this.drugMasterService.updateDrugStatus(this.dataObj).subscribe(response => { this.alertMessage.alert(status + "d successfully", 'success') },
          (err) => {
            console.log("error", err);
            //this.alertMessage.alert(err, 'error')
          });
        drugGroup.deleted = !drugGroup.deleted;

      }

    })
  }
  activePage;
  // updateStatusHandler(response) {

  //   console.log("Drug Group status changed");
  // }

  remove_obj(index) {
    this.drugGroupList.splice(index, 1);
  }

  drugGroupID: any;
  drugGroup: any;
  drugGroupDesc: any;
  stateID: any;

  initializeObj() {
    this.drugGroupID = "";
    this.drugGroup = "";
    this.drugGroupDesc = "";
    this.stateID = "";
  }
  editDrugGroup(drug) {
    this.drugGroupID = ( drug.drugGroupID !==null && drug.drugGroupID !==undefined) ? parseInt(drug.drugGroupID):null;
    this.drugGroup = (typeof drug.drugGroup === 'string' && drug.drugGroup.trim() !== '') ? drug.drugGroup.trim() : null;
    this.drugGroupDesc = (typeof drug.drugGroupDesc === 'string' && drug.drugGroupDesc.trim() !== '') ?  drug.drugGroupDesc.trim() : null;
    //this.stateID = drug.m_providerServiceMapping.state.stateID;
    this.editable = true;
    this.drugGroupToEdit = drug.drugGroup;
  }
  // editDrugGroup(drug) {
  //   this.drugGroupID = (drug.drugGroupID !== undefined && drug.drugGroupID !== null) ? drug.drugGroupID.trim() : null;
  //   this.drugGroup = (drug.drugGroup !== undefined && drug.drugGroup !== null) ? drug.drugGroup.trim() : null;
  //   this.drugGroupDesc = (drug.drugGroupDesc !== undefined && drug.drugGroupDesc !== null) ?  drug.drugGroupDesc.trim() : null;
  //   //this.stateID = drug.m_providerServiceMapping.state.stateID;
  //   this.editable = true;
  //   this.drugGroupToEdit = drug.drugGroup;
  // }

  updateDrugGroup(drugGroup) {
    if (drugGroup.drugGroup !== undefined && drugGroup.drugGroup !== null && (drugGroup.drugGroup.trim() === "")) {

      this.alertMessage.alert("Please enter valid Drug Group Name");
    }

    else {
      this.dataObj = {};
      this.dataObj.drugGroupID = (this.drugGroupID !== undefined && this.drugGroupID !== null) ? this.drugGroupID : null;
      this.dataObj.drugGroup = (drugGroup.drugGroup !== undefined && drugGroup.drugGroup !== null) ? drugGroup.drugGroup.trim() : null;
      this.dataObj.drugGroupDesc = (drugGroup.drugGroupDesc !== undefined && drugGroup.drugGroupDesc !== null) ? drugGroup.drugGroupDesc.trim() : null;
      //this.dataObj.providerServiceMapID = drugGroup.providerServiceMapID;
      this.dataObj.modifiedBy = this.createdBy;
      this.drugMasterService.updateDrugGroup(this.dataObj).subscribe(response => {
        if (response !== undefined && response !== null)
          this.updateHandler(response)
      },
        (err) => {
          console.log("error", err);
          //this.alertMessage.alert(err, 'error')
        });
    }

  }

  updateHandler(response) {
    this.editable = false;
    this.alertMessage.alert("Updated successfully", 'success');
    this.getAvailableDrugs();
    this.availableDrugGroupNames = [];
  }

  groupNameExist: any = false;
  inValidDrugGroup = false;
  checkExistance(drugGroup) {
    if (this.editable) {

      if (drugGroup !== undefined && drugGroup !== null && (drugGroup.trim() !== this.drugGroupToEdit)) {
        this.checkWithDrugmaster(drugGroup);
      }

    } else {
     this.checkWithDrugmaster(drugGroup);
    }

  }
checkWithDrugmaster(drugGroup) {
  if (drugGroup !== undefined && drugGroup !== null && (drugGroup.trim() !== "")) {
      this.inValidDrugGroup = false;
      this.groupNameExist = this.availableDrugGroupNames.includes(drugGroup.trim());
    }
    else{
      this.inValidDrugGroup = true;
      this.groupNameExist = false;
    }
  }
  clearEdit() {
    this.initializeObj();
    this.showDrugGroups = true;
    this.editable = false;
    this.groupNameExist = false;
  }
  filterComponentList(searchTerm?: string) {
    if (!searchTerm) {
      this.filteredavailableDrugGroups = this.availableDrugGroups;
    } else {
      this.filteredavailableDrugGroups = [];
      this.availableDrugGroups.forEach((item) => {
        for (let key in item) {
          if (key == 'drugGroup') {
            let value: string = '' + item[key];
            if (value.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0) {
              this.filteredavailableDrugGroups.push(item); break;
            }
          }
        }
      });
    }

  }
  back() {
    this.alertMessage.confirm('Confirm', "Do you really want to cancel? Any unsaved data would be lost").subscribe(res => {
      if (res) {
        this.drugGroupForm.resetForm();
        this.clearEdit();
        this.drugGroupList = [];
      }
    })
  }
  checkForValidDrugDesc(drugDesc) {
    if(drugDesc !== undefined && drugDesc !== null && (drugDesc.trim() === "")) {
      this.invalidDrugDesc = true;
    } else {
      this.invalidDrugDesc = false;
    }

  }

}