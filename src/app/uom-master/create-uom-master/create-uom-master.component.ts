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
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormArray, FormGroup, } from '@angular/forms';

import { ConfirmationDialogsService } from '../../services/dialog/confirmation.service';
import { UomMasterService } from '../../services/inventory-services/uom-master.service';

@Component({
  selector: 'app-create-uom-master',
  templateUrl: './create-uom-master.component.html',
  styleUrls: ['./create-uom-master.component.css']
})
export class CreateUomMasterComponent implements OnInit {

  @Input('otherDetails')
  otherDetails: any;

  @Output('modeChange')
  modeChange = new EventEmitter();

  UOMMasterForm: FormGroup
  createdBy: string;
  providerServiceMapID: string;
  UOMMasterList = [];

  constructor(
    private fb: FormBuilder,
    private notificationService: ConfirmationDialogsService,
    private uomMasterService: UomMasterService) { }

  ngOnInit() {
    this.UOMMasterForm = this.createUOMMasterForm();
    if (this.otherDetails) {
      this.createdBy = this.otherDetails.createdBy;
      this.providerServiceMapID = this.otherDetails.providerServiceMapID;
    }
  }

  createUOMMasterForm() {
    return this.fb.group({
      UOM: this.fb.group({
        uOMCode: null,
        uOMName: null,
        uOMDesc: null
      })
    })
  }

  addToUOMMasterList() {
    if (this.UOMMasterForm.valid) {
      let temp = JSON.parse(JSON.stringify(this.UOMMasterForm.value));
      if (temp && temp.UOM && temp.UOM.uOMCode) {
        this.UOMMasterList.push(temp.UOM);
        this.UOMMasterForm.controls['UOM'].reset();
      }
    } else {
      this.notificationService.alert("Enter the required field or valid value");
    }
  }

  checkForUniqueUOMCode() {
    let temp = JSON.parse(JSON.stringify(this.UOMMasterForm.value));
    if (temp.UOM.uOMCode) {
      let arr = this.UOMMasterList.filter(item => item.uOMCode == temp.UOM.uOMCode);
      this.uomMasterService.checkForUniqueUOMCode(temp.UOM.uOMCode, this.providerServiceMapID)
        .subscribe(response => {
          let flag = response.response;
          if (flag == 'true' || arr.length > 0) {
            (<FormGroup>this.UOMMasterForm.controls['UOM']).controls['uOMCode'].setErrors({ unique: true });
          } else {
            (<FormGroup>this.UOMMasterForm.controls['UOM']).controls['uOMCode'].setErrors(null);
          }
          console.log(response, temp.length);
        })
    }
  }

  deleteFromUOMMasterList(i) {
    this.UOMMasterList.splice(i, 1);
  }

  submitUOMForm() {
    let temp = this.UOMMasterList.slice();
    temp.forEach(item => {
      item.createdBy = this.createdBy;
      item.providerServiceMapID = this.providerServiceMapID;
    })

    this.uomMasterService.postUOMMaster(temp)
      .subscribe(response => {
        if (response.length > 0) {
          this.notificationService.alert("Saved successfully", 'success');
          this.switchToViewMode();
        }
      }, (err) => {
        this.notificationService.alert(err.errorMessage, 'error');
        console.error("error in fetching uom masters")
      });
  }

  switchToViewMode() {
    this.modeChange.emit('view');
  }
}
