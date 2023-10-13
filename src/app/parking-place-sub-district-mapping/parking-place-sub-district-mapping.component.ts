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
import { NgForm } from '@angular/forms';
import { dataService } from '../services/dataService/data.service';
import { ConfirmationDialogsService } from '../services/dialog/confirmation.service';
import { ParkingPlaceMasterService } from '../services/ProviderAdminServices/parking-place-master-services.service';
import { MdDialog } from '@angular/material';
import { MD_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-parking-place-sub-district-mapping',
  templateUrl: './parking-place-sub-district-mapping.component.html',
  styleUrls: ['./parking-place-sub-district-mapping.component.css']
})
export class ParkingPlaceSubDistrictMappingComponent implements OnInit {

  userID: any;
  createdBy: any;
  providerServiceMapID: any;
  service: any;
  state: any;
  zoneID: any;
  parking_Place: any;
  district: any;
  taluk: any;
  status: any;
  editMappedValue: any;
  parkAndHub: any;

  showTable: boolean = false;
  editable: boolean = false;
  disableSelection: boolean = false;
  showListOfMapping: boolean = true;
  enableButton: boolean = false;

  /*Arrays*/
  servicelines: any = [];
  states: any = [];
  zones: any = [];
  parkingPlaces: any = [];
  mappedParkingPlaceDistricts: any = [];
  districts: any = [];
  taluks: any = [];
  mappingList: any = [];
  existingTaluks: any = [];
  availableTaluks: any = [];
  bufferTalukArray: any = [];
  filteredMappedParkingPlaceDistricts: any = [];

  @ViewChild('mappingForm') mappingForm: NgForm;
  constructor(public commonDataService: dataService,
    public parkingPlaceMasterService: ParkingPlaceMasterService,
    public dialog: MdDialog,
    private alertService: ConfirmationDialogsService) { }

  ngOnInit() {
    this.userID = this.commonDataService.uid;
    this.createdBy = this.commonDataService.uname;
    this.getServicelines();
  }
  getServicelines() {
    this.parkingPlaceMasterService.getServiceLinesNew(this.userID).subscribe((response) => {
      this.getServicesSuccessHandeler(response),
        (err) => {
          console.log("ERROR in fetching serviceline", err);
        }
    });
  }
  getServicesSuccessHandeler(response) {
    this.servicelines = response;
  }
  getStates(value) {
    this.resetArrays();
    if (value.serviceID == 4) {
      this.parkAndHub = "Hub";
    } else {
      this.parkAndHub = "Parking Place";
    }
    let obj = {
      'userID': this.userID,
      'serviceID': value.serviceID,
      'isNational': value.isNational
    }
    this.parkingPlaceMasterService.getStatesNew(obj).
      subscribe((response) => {
        this.getStatesSuccessHandeler(response),
          (err) => {
            console.log("error in fetching states", err);
          }
        //this.alertMessage.alert(err, 'error');
      });

  }

  getStatesSuccessHandeler(response) {
    this.states = response;
  }
  resetArrays() {
    this.mappedParkingPlaceDistricts = [];
    this.filteredMappedParkingPlaceDistricts = [];
    this.enableButton = false;
    this.zones = [];
    this.parkingPlaces = [];
  }
  setProviderServiceMapID(providerServiceMapID) {
    this.resetArrays();
    console.log("providerServiceMapID", providerServiceMapID);
    this.providerServiceMapID = providerServiceMapID;
    this.getAvailableZones(this.providerServiceMapID);

  }
  getAvailableZones(providerServiceMapID) {
    this.parkingPlaceMasterService.getZones({ "providerServiceMapID": providerServiceMapID }).subscribe(response => this.getZonesSuccessHandler(response));
  }
  getZonesSuccessHandler(response) {
    if (response != undefined) {
      for (let zone of response) {
        if (!zone.deleted) {
          this.zones.push(zone);
        }
      }
    }
  }
  getAllParkingPlaces(zoneID, providerServiceMapID) {
    this.mappedParkingPlaceDistricts = [];
    this.filteredMappedParkingPlaceDistricts = [];
    this.enableButton = false;
    let parkingPlaceObj = {
      "zoneID": zoneID,
      "providerServiceMapID": providerServiceMapID
    };
    this.parkingPlaceMasterService.getParkingPlaces(parkingPlaceObj).subscribe(response => this.getParkingPlaceSuccessHandler(response));

  }
  getParkingPlaceSuccessHandler(response) {
    this.parkingPlaces = response;
  }
  getParkingPlaceSubDistrictMappings(providerServiceMapID, zoneID, parkingPlaceID) {
    let mappedReqObj = {
      "providerServiceMapID": providerServiceMapID,
      "zoneID": zoneID,
      "parkingPlaceID": parkingPlaceID
    }
    this.parkingPlaceMasterService.getAllParkingPlaceSubDistrictMapping(mappedReqObj)
      .subscribe(response => this.getMappingSuccessHandler(response));

  }
  getMappingSuccessHandler(response) {
    this.mappedParkingPlaceDistricts = response;
    this.filteredMappedParkingPlaceDistricts = response;
    this.showTable = true;
    this.enableButton = true;
  }

  showForm() {
    this.disableSelection = true;
    this.showTable = false;
    this.showListOfMapping = false;
    this.getDistricts(this.zoneID.zoneID);

  }
  getDistricts(zoneID) {
    this.parkingPlaceMasterService.getDistricts(zoneID)
      .subscribe(districtResponse => this.getDistrictsSuccessHandeler(districtResponse));
  }
  getDistrictsSuccessHandeler(districtResponse) {
    this.districts = districtResponse;
    if (this.editMappedValue != undefined) {
      let editDistrict = this.districts.filter((editDistrictValue) => {
        if (this.editMappedValue.districtID != undefined && this.editMappedValue.districtID == editDistrictValue.districtID) {
          return editDistrictValue;
        }
      })[0]
      if (editDistrict) {
        this.district = editDistrict;
      }
    }
  }
  getTaluks(districtID, providerServiceMapID) {
    this.taluk = null;
    this.parkingPlaceMasterService.getTaluks(districtID)
      .subscribe(talukResponse => this.getTaluksSuccessHandler(talukResponse, districtID, providerServiceMapID));
  }
  getTaluksSuccessHandler(talukResponse, districtID, providerServiceMapID) {
    this.taluks = talukResponse;
    if (this.taluks) {
      this.checkExistance(districtID, providerServiceMapID);
    }

  }
  checkExistance(districtID, providerServiceMapID) {
    let unmappedObj = {
      "districtID": districtID,
      "providerServiceMapID": providerServiceMapID
    }
    this.parkingPlaceMasterService.filterMappedTaluks(unmappedObj).subscribe((response) => {
      this.availableTaluks = response;
      console.log("availableTaluks", this.availableTaluks);
      if (!this.editable) {
        if (this.mappingList.length > 0) {
          this.mappingList.forEach((talukList) => {
            this.bufferTalukArray.push(talukList.districtBlockID);
          });
        }

        let bufferTemp = [];
        this.availableTaluks.forEach((bufferTaluk) => {
          let index = this.bufferTalukArray.indexOf(bufferTaluk.blockID);
          if (index < 0) {
            bufferTemp.push(bufferTaluk);
          }
        });
        this.availableTaluks = bufferTemp.slice();
        this.bufferTalukArray = [];
      }
      // on edit - populate the non mapped categories
      else {
        if (this.editMappedValue != undefined) {
          let editTaluk = this.taluks.filter((editTalukValue) => {
            if (this.editMappedValue.districtBlockID == editTalukValue.blockID && this.editMappedValue.districtID == this.district.districtID) {
              return editTalukValue;
            }
          })[0]
          if (editTaluk) {
            this.taluk = editTaluk;
            this.availableTaluks.push(editTaluk);
          }
        }

      }
    });
  }

  addMappingObject(formValue) {
    console.log("formValue", formValue);
    for (let taluks of formValue.taluk) {
      let talukID = taluks.blockID;
      let mappingObject = {
        "providerServiceMapID": this.providerServiceMapID,
        "parkingPlaceID": this.parking_Place.parkingPlaceID,
        "parkingPlaceName": this.parking_Place.parkingPlaceName,
        "districtID": formValue.district.districtID,
        "districtName": formValue.district.districtName,
        "districtBlockID": talukID,
        "districtBlockName": taluks.blockName,
        "createdBy": this.createdBy
      }
      this.mappingList.push(mappingObject);
      this.mappingForm.resetForm();
      this.availableTaluks = [];
    }

  }

  remove_obj(index) {
    this.mappingList.splice(index, 1);
    this.getTaluks(this.district.districtID, this.state.providerServiceMapID);
  }

  saveSubdistrictMapping() {
    this.parkingPlaceMasterService.saveParkingPlaceSubDistrictMapping(this.mappingList)
      .subscribe(response => this.saveSuccessHandler(response))

  }
  saveSuccessHandler(response) {
    this.alertService.alert("Mapping saved successfully", 'success');
    this.mappingList = [];
    this.showList();
  }
  back() {
    this.alertService.confirm('Confirm', "Do you really want to cancel? Any unsaved data would be lost").subscribe(res => {
      if (res) {
        this.showList();
        this.mappingList = [];
        this.editMappedValue = undefined;
      }
    })
  }
  showList() {
    this.getParkingPlaceSubDistrictMappings(this.state.providerServiceMapID, this.zoneID.zoneID, this.parking_Place.parkingPlaceID);
    this.editable = false;
    this.disableSelection = false;
    this.showListOfMapping = true;
    this.showTable = false;
    this.mappingForm.resetForm();
  }

  editSubDistrictMapping(selectedValue) {
    console.log("selectedValue", selectedValue);
    this.editable = true;
    this.disableSelection = true;
    this.showListOfMapping = false;
    this.showTable = false;
    this.editMappedValue = selectedValue;
    this.getDistricts(this.zoneID.zoneID);
    this.getTaluks(selectedValue.districtID, selectedValue.providerServiceMapID);
  }

  updateSubdistrictMapping(formValue) {
    let updateObj = {
      "ppSubDistrictMapID": this.editMappedValue.ppSubDistrictMapID,
      "providerServiceMapID": this.editMappedValue.providerServiceMapID,
      "parkingPlaceID": this.editMappedValue.parkingPlaceID,
      "districtID": formValue.district.districtID,
      "districtBlockID": formValue.taluk.blockID,
      "createdBy": this.createdBy
    }
    this.parkingPlaceMasterService.updateTalukMapping(updateObj)
      .subscribe(response => this.updateSuccessHandler(response));

  }
  updateSuccessHandler(response) {
    this.editMappedValue = null;
    this.showList();
    this.alertService.alert("Updated successfully", 'success');

  }

  activateDeactivateMapping(parkingPlace, parkingPlaceNotExist) {
    if (parkingPlaceNotExist) {
      this.alertService.alert("Parking place is inactive");
    } else {
      let flag = !parkingPlace.deleted

      if (flag) {
        this.status = 'Deactivate';
      } else {
        this.status = 'Activate';
      }
      this.alertService.confirm('Confirm', "Are you sure you want to " + this.status + "?").subscribe((res) => {
        if (res) {
          let obj = {
            "ppSubDistrictMapID": parkingPlace.ppSubDistrictMapID,
            "deleted": flag
          }
          console.log("Deactivating or activating Obj", obj);
          this.parkingPlaceMasterService.mappingActivationDeactivation(obj)
            .subscribe((res) => {
              console.log('Activation or deactivation response', res);
              this.alertService.alert(this.status + "d successfully", 'success');
              this.getParkingPlaceSubDistrictMappings(this.state.providerServiceMapID, this.zoneID.zoneID, this.parking_Place.parkingPlaceID);
            }, (err) => console.log('error', err))
        }
      },
        (err) => {
          console.log(err);
        })
    }
  }
  filterComponentList(searchTerm?: string) {
    if (!searchTerm) {
      this.filteredMappedParkingPlaceDistricts = this.mappedParkingPlaceDistricts;
    } else {
      this.filteredMappedParkingPlaceDistricts = [];
      this.mappedParkingPlaceDistricts.forEach((item) => {
        for (let key in item) {
          if (key == 'districtName' || key == 'districtBlockName') {
            let value: string = '' + item[key];
            if (value.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0) {
              this.filteredMappedParkingPlaceDistricts.push(item); break;
            }
          }
        }
      });
    }

  }
}


