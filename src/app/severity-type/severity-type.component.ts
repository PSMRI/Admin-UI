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
import { ProviderAdminRoleService } from '../services/ProviderAdminServices/state-serviceline-role.service';
import { dataService } from '../services/dataService/data.service';
import { SeverityTypeService } from '../services/ProviderAdminServices/severity-type-service';
import { MdDialog, MdDialogRef } from '@angular/material';
import { MD_DIALOG_DATA } from '@angular/material';
import { ConfirmationDialogsService } from '../services/dialog/confirmation.service';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-severity-type',
  templateUrl: './severity-type.component.html',
  styleUrls: ['./severity-type.component.css']
})
export class SeverityTypeComponent implements OnInit {

  filtereddata: any = [];
  states: any = [];
  stateId: any;
  serviceProviderID: any;
  service: any;
  services: any = [];
  firstPage: boolean = true;
  description: any;
  severity: any;
  data: any = [];
  searchArray: any = [];
  search: boolean = false;
  alreadyExist: boolean = false;
  providerServiceMapID: any;
  showTable: boolean = false;

  userID: any;
  isNational: any;
  providerServiceMapID_1097: any;
  severityArray: any = [];
  createdBy: any;


  @ViewChild('severityAdding') severityAdding: NgForm;
  constructor(
    public commonDataService: dataService,
    public severityTypeService: SeverityTypeService,
    public dialog: MdDialog,
    private alertService: ConfirmationDialogsService) { }

  ngOnInit() {
    this.serviceProviderID = (this.commonDataService.service_providerID).toString();
    this.userID = this.commonDataService.uid;
    this.createdBy = this.commonDataService.uname;

    this.getProviderServices();
  }


  getProviderServices() {
    this.severityTypeService.getServices(this.userID).subscribe(response => {
      console.log('success while getting services', response);
      this.services = response;
    }, err => {

      console.log('err while getting services', err);
    })
  }

  getProviderStates(serviceID, isNational) {
    this.severityTypeService.getStates(this.userID, serviceID, isNational).subscribe(response => {
      console.log('success while getting states', response);
      this.stateId = undefined;
      this.states = response;
      this.setIsNational(isNational);
    }, err => {

      console.log('err while getting states', err);
    })


  }

  // getServices(state) {
  //   this.search = false;
  //   this.service = "";
  //   this.ProviderAdminRoleService.getServices(this.serviceProviderID, state)
  // .subscribe(response => this.servicesSuccesshandeler(response));
  // }

  setIsNational(value) {
    this.isNational = value;

    if (value) {
      this.providerServiceMapID_1097 = this.states[0].providerServiceMapID;
      this.findSeverity(this.providerServiceMapID_1097);
    }
  }

  // servicesSuccesshandeler(response) {
  //   console.log(response);
  //   this.services = response.filter(function (obj) {
  //     // return obj.serviceName == 104 || obj.serviceName == 1097 || obj.serviceName == "MCTS"
  //     return obj.serviceName == 104 || obj.serviceName == 1097
  //   });
  // }

  findSeverity(psmID) {
    console.log(psmID);
    this.data = [];
    this.filtereddata = [];
    this.providerServiceMapID = psmID;
    this.search = true;
    this.severityTypeService.getSeverity(this.providerServiceMapID).subscribe(response => this.getSeveritysuccesshandler(response),
      (err) => {
        console.log("Error", err);
        //this.dialogService.alert(err, 'error')
      });

  }

  getSeveritysuccesshandler(response) {
    this.data = response;
    this.filtereddata = response;
  }

  showAddScreen() {
    this.handlingFlag(false);
  }

  addSeverity(severity) {
    this.alreadyExist = false;
    // this.searchArray = this.data.concat(this.severityArray);
    console.log("searchArray", this.searchArray);
    let count = 0;
    for (var i = 0; i < this.data.length; i++) {
      if (this.data[i].severityTypeName.toLowerCase() == severity.toLowerCase()) {
        count++;
      }
    }
    if (count > 0) {
      this.alreadyExist = true;
    }

  }
  add(values) {
    let obj = {
      'severityTypeName': values.severity,
      'severityDesc': values.description,
      'providerServiceMapID': this.providerServiceMapID,
      'createdBy': this.createdBy
    }
    if (this.severityArray.length == 0 && (obj.severityTypeName != "" && obj.severityTypeName != undefined)) {
      this.severityArray.push(obj);
    }
    else {
      let count = 0;
      for (let i = 0; i < this.severityArray.length; i++) {
        if (obj.severityTypeName === this.severityArray[i].severityTypeName) {
          count = count + 1;
        }
      }
      if (count == 0) {
        this.severityArray.push(obj);
      }
      else {
        this.alertService.alert("Already exists");
      }
    }

    // this.severityArray.push(obj);
    this.severityAdding.resetForm();
    // this.addSeverity(values.severity);
    // this.alreadyExist = false;
  }
  handlingFlag(flag) {
    this.firstPage = flag;

    if (flag) {
      this.severity = "";
      this.description = "";
      this.severityArray = [];
    }
  }
  back() {
    this.alertService.confirm('Confirm', "Do you really want to cancel? Any unsaved data would be lost").subscribe(res => {
      if (res) {
        this.handlingFlag(true);
      }
    })
  }
  removeObj(i) {
    this.severityArray.splice(i, 1);
  }
  finalSubmit() {
    this.severityTypeService.addSeverity(this.severityArray).subscribe(response => this.createdSuccessHandler(response),
      (err) => {
        console.log("Error", err);
        //this.dialogService.alert(err, 'error')
      });
  }
  createdSuccessHandler(res) {
    // alert("severity added successfully");
    this.alertService.alert('Saved successfully', 'success');
    this.handlingFlag(true);
    this.findSeverity(this.providerServiceMapID);
    this.severityArray = [];
    this.severity = "";
    this.description = "";

  }
  //severityID
  confirmMessage: any;
  deleteSeverity(id, flag) {

    let obj = {
      "severityID": id,
      "deleted": flag
    }


    if (flag) {
      this.confirmMessage = 'Deactivate';
    } else {
      this.confirmMessage = 'Activate';
    }

    this.alertService.confirm('Confirm', "Are you sure you want to " + this.confirmMessage + "?").subscribe((res) => {
      if (res) {
        this.severityTypeService.deleteSeverity(obj).subscribe(response => this.deleteSuccessHandler(response));
      }
    },
      (err) => {

        console.log(err);
      })
  }
  deleteSuccessHandler(res) {
    // alert("deleted successfully");
    this.severityTypeService.getSeverity(this.providerServiceMapID).subscribe(response => this.getSeveritysuccesshandler(response),
      (err) => {
        console.log("Error", err);
        //this.dialogService.alert(err, 'error')
      });

    this.alertService.alert(this.confirmMessage + "d successfully", 'success');
  }
  editSeverity(obj) {
    let dialogReff = this.dialog.open(EditSeverityModalComponent, {
      width: '500px',
      disableClose: true,
      data: {
        "severityObj": obj,
        "searchArray": this.data
      }
    });
    //     dialogReff.afterClosed().subscribe(()=>{
    //     this.severityTypeService.getSeverity(this.providerServiceMapID).subscribe(response=>this.getSeveritysuccesshandler(response));
    // });

    dialogReff.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
      if (result === "success") {
        this.alertService.alert("Updated successfully", 'success');
        this.severityTypeService.getSeverity(this.providerServiceMapID).subscribe(response => this.getSeveritysuccesshandler(response),
          (err) => {
            console.log("Error", err);
            //this.dialogService.alert(err, 'error')
          });
      }

    });
  }
  clear() {
    this.data = [];
    this.services = [];
    this.search = false;
    this.filtereddata = [];
  }
  filterComponentList(searchTerm?: string) {
    if (!searchTerm) {
      this.filtereddata = this.data;
    } else {
      this.filtereddata = [];
      this.data.forEach((item) => {
        for (let key in item) {
          if (key == 'severityTypeName') {
            let value: string = '' + item[key];
            if (value.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0) {
              this.filtereddata.push(item); break;
            }
          }
        }
      });
    }

  }
}

@Component({
  selector: 'edit-severity-component',
  templateUrl: './edit-severity-component-modal.html',
})
export class EditSeverityModalComponent {


  severity: any;
  originalSeverity: any;
  description: any;
  alreadyExist = false;
  searchArray = [];
  constructor(@Inject(MD_DIALOG_DATA) public data: any,
    public dialog: MdDialog, public severityTypeService: SeverityTypeService, public alertService: ConfirmationDialogsService,
    public dialogReff: MdDialogRef<EditSeverityModalComponent>,
  ) { }
  ngOnInit() {
    this.originalSeverity = this.data.severityObj.severityTypeName;
    this.severity = this.data.severityObj.severityTypeName;
    this.description = this.data.severityObj.severityDesc;
    this.searchArray = this.data.searchArray;
  }
  modify(value) {
    let object = {
      "severityID": this.data.severityObj.severityID,
      "severityTypeName": value.severity,
      "severityDesc": value.description
    }
    this.severityTypeService.modifySeverity(object).subscribe(response => this.modifiedSuccessHandler(response),
      (err) => {
        console.log("error", err);
        //this.alertService.alert(err, 'error')});
      });
  }
  addSeverity(value) {
    this.alreadyExist = false;
    console.log("searchArray", this.searchArray);
    let count = 0;
    for (var i = 0; i < this.searchArray.length; i++) {
      if (this.searchArray[i].severityTypeName.toLowerCase() == value.toLowerCase() && value.toLowerCase() != this.originalSeverity.toLowerCase()) {
        count++;
      }
    }
    if (count > 0) {
      this.alreadyExist = true;
    }
  }
  modifiedSuccessHandler(res) {

    this.dialogReff.close('success');

  }
}
