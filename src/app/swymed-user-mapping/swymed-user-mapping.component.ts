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
import { dataService } from '../services/dataService/data.service';
import { ConfirmationDialogsService } from '../services/dialog/confirmation.service';
import { SwymedUserConfigurationService } from '../services/ProviderAdminServices/swymed-user-service';
import { NgForm } from '@angular/forms';
import { isDefined } from '@angular/compiler/src/util';
@Component({
  selector: 'app-swymed-user-mapping',
  templateUrl: './swymed-user-mapping.component.html',
  styleUrls: ['./swymed-user-mapping.component.css']
})
export class SwymedUserMappingComponent implements OnInit {

  createdBy: any;
  serviceProviderID: any;
  designation: any;
  emailID: any;
  password: any;
  username: any;
  domain: any;
  dataToBeEdit: any;
  status: any;

  swymedUserDetails: any = [];
  designations: any = [];
  userNamesList: any = [];
  domainList: any = [];
  filteredswymedUserDetails: any = [];

  showTable: Boolean = true;
  editMode: Boolean = false;
  disableSelection: Boolean = false;

  dynamictype: any = 'password';

  emailPattern = /^[0-9a-zA-Z_.]+@[a-zA-Z_]+?\.\b(org|com|COM|IN|in|co.in)\b$/;
  passwordPattern = /^(?=.*[0-9])(?=.*[A-Z])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,12}$/;

  @ViewChild('mappingForm') mappingForm: NgForm;

  constructor(
    public swymedUserConfigService: SwymedUserConfigurationService,
    public dataServiceValue: dataService,
    public dialogService: ConfirmationDialogsService) { }

  ngOnInit() {
    this.createdBy = this.dataServiceValue.uname;
    this.serviceProviderID = this.dataServiceValue.service_providerID;
    this.getAllSwymedUserDetails();
  }
  /*
  * To fetch mapped user details
  */
  getAllSwymedUserDetails() {
    this.swymedUserConfigService.getSwymedUserDetails(this.serviceProviderID).subscribe(userResponse => {
      if (userResponse != undefined) {
        this.swymedUserDetails = userResponse;
        this.filteredswymedUserDetails = userResponse;
      }
    }, (err) => {
      console.log("error", err.errorMessage);
      this.dialogService.alert(err.errorMessage, "error");
    })
  }
  showForm() {
    this.showTable = false;
    this.disableSelection = false;
    this.editMode = false;
    this.dataToBeEdit = undefined;
    this.getAllDesignations();
    this.getVideoConsultationDomain();
  }

  /*
  * To fetch Designation
  */
  getAllDesignations() {
    this.swymedUserConfigService.getAllDesignations().subscribe((desigRes) => {
      if (desigRes != undefined) {
        this.designations = desigRes;
      }
      if (this.dataToBeEdit != undefined) {
        let editDesig = this.designations.filter((editDesigValue) => {
          if (this.dataToBeEdit.designationName != undefined && this.dataToBeEdit.designationName == editDesigValue.designationName) {
            return editDesigValue;
          }
        })[0]
        if (editDesig) {
          this.designation = editDesig;
        }
      }
    }, (err) => {
      this.dialogService.alert(err.errorMessage, "error");
    })
  }

  /*
  * To fetch user list
  */
  getUserNameBasedOnDesig(designationID) {
    this.swymedUserConfigService.getUserName(designationID, this.serviceProviderID)
      .subscribe(response => {
        if (response != undefined) {
          this.userNamesList = response;
        }
        if (this.dataToBeEdit != undefined) {
          let editUser = this.userNamesList.filter((editUserValue) => {
            if (this.dataToBeEdit.userName != undefined && this.dataToBeEdit.userName == editUserValue.UserName) {
              return editUserValue;
            }
          })
          if (editUser) {
            this.username = editUser;
          }
        }
      }, (err) => {
        this.dialogService.alert(err.errorMessage, "error");
      })
  }

  showPWD() {
    this.dynamictype = 'text';
  }

  hidePWD() {
    this.dynamictype = 'password';
  }

  /*
  * To fetch swymed domain
  */
  getVideoConsultationDomain() {
    this.swymedUserConfigService.getVideoConsultationDomain(this.serviceProviderID).subscribe((domainResponse) => {
      if (domainResponse != undefined) {
        this.domainList = domainResponse;
      }
      if (this.dataToBeEdit != undefined) {
        let editDomain = this.domainList.filter((editDomainValue) => {
          if (this.dataToBeEdit.videoConsultationDomain != undefined && this.dataToBeEdit.videoConsultationDomain == editDomainValue.videoConsultationDoamin) {
            return editDomainValue;
          }
        })[0]
        if (editDomain) {
          this.domain = editDomain;
        }
      }
    }, (err) => {
      this.dialogService.alert(err.errorMessage, "error");
    })
  }

  /*
  * Save API Call
  */

  saveUserMapping(formValue) {
    let saveReqObj = {
      "userID": formValue.username.userID,
      "videoConsultationEmailID": formValue.emailID,
      "videoConsultationPassword": formValue.password,
      "videoConsultationDomain": formValue.domain.videoConsultationDoamin,
      "createdBy": this.createdBy,

    }
    this.swymedUserConfigService.saveSwymedUserDetails(saveReqObj).subscribe((saveResponse) => {
      if (saveResponse.statusCode == 200) {
        this.dialogService.alert("Saved successfully", "success");
        this.getAllSwymedUserDetails();
        this.resetForm();
      }
    }, (err) => {
      if (err._body != undefined) {
        err = (err['_body']).replace(/(\d+)([\[:.])?(\d+)([,\}\]])/g, "\"$1$2$3\"$4");
        err = JSON.parse(err);
      }
      if (err.statusCode == 5010) {
        this.dialogService.alert(err.errorMessage, "error");
      } else if (err.statusCode == 5000) {
        this.dialogService.alert("Invalid input", "error");
      } else {
        console.log("error");
      }
    })
  }

  back() {
    this.dialogService.confirm('Confirm', "Do you really want to cancel? Any unsaved data would be lost").subscribe(res => {
      if (res) {
        this.resetForm();
      }
    })
  }

  resetForm() {
    this.showTable = true;
    this.editMode = false;
    this.mappingForm.reset();

  }

  editUserDetails(editValue) {
    console.log("editValue", editValue);
    this.dataToBeEdit = editValue;
    this.disableSelection = true;
    this.editMode = true;
    this.showTable = false;
    this.getAllDesignations();
    this.getUserNameBasedOnDesig(editValue.designationID);
    this.getVideoConsultationDomain();
    this.emailID = editValue.videoConsultationEmailID;
    this.password = editValue.videoConsultationPassword;

  }
  /*
  * Update API Call
  */

  updateUsermapping(formValue) {
    let updateObj = {
      "videoConsultationEmailID": formValue.emailID,
      "videoConsultationPassword": formValue.password,
      "videoConsultationDomain": this.dataToBeEdit.videoConsultationDomain,
      "userID": this.dataToBeEdit.userID,
      "userVideoConsultationMapID": this.dataToBeEdit.userVideoConsultationMapID,
      "modifiedBy": this.createdBy
    }
    this.swymedUserConfigService.updateUserDetails(updateObj).subscribe((updateResponse) => {
      if (updateResponse.statusCode == 200) {
        this.dialogService.alert("Updated successfully", "success");
        this.getAllSwymedUserDetails();
        this.dataToBeEdit = undefined;
        this.resetForm();
      }
    }, (err) => {
      if (err._body != undefined) {
        err = (err['_body']).replace(/(\d+)([\[:.])?(\d+)([,\}\]])/g, "\"$1$2$3\"$4");
        err = JSON.parse(err);
      }
      if (err.statusCode == 5010) {
        this.dialogService.alert(err.errorMessage, "error");
      } else if (err.statusCode == 5000) {
        this.dialogService.alert("Invalid input", "error");
      } else {
        console.log("error", err);
      }

    })
  }
  /*
  * Activate or deactivate user mapping 
  */
  activateDeactivateMapping(item, userDeleted) {
    if (userDeleted) {
      this.dialogService.alert("User is inactive");
    } else {
      let flag = !item.Deleted
      if (flag) {
        this.status = 'Deactivate';
      } else {
        this.status = 'Activate';
      }
      this.dialogService.confirm('Confirm', "Are you sure you want to " + this.status + "?").subscribe((res) => {
        if (res) {
          this.swymedUserConfigService.mappingActivationDeactivation(item.userVideoConsultationMapID, flag, item.modifiedBy)
            .subscribe((res) => {
              console.log('Activation or deactivation response', res);
              this.dialogService.alert(this.status + "d successfully", 'success');
              this.getAllSwymedUserDetails();
            }, (err) => {
              if (err._body != undefined) {
                err = (err['_body']).replace(/(\d+)([\[:.])?(\d+)([,\}\]])/g, "\"$1$2$3\"$4");
                err = JSON.parse(err);
              }
              if (err.statusCode == 5010) {
                this.dialogService.alert(err.errorMessage, "error");
              } else if (err.statusCode == 5000) {
                this.dialogService.alert("Invalid input", "error");
              } else {
                console.log("error", err);
              }

            })
        }
      },
        (err) => {
          console.log(err);
        })
    }
  }
  filterComponentList(searchTerm?: string) {
    if (!searchTerm) {
      this.filteredswymedUserDetails = this.swymedUserDetails;
    } else {
      this.filteredswymedUserDetails = [];
      this.swymedUserDetails.forEach((item) => {
        for (let key in item) {
          if (key == 'userName' || key == 'videoConsultationDomain' || key == 'designationName') {
            let value: string = '' + item[key];
            if (value.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0) {
              this.filteredswymedUserDetails.push(item); break;
            }
          }
        }
      });
    }

  }
}
