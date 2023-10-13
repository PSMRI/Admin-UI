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
import { Component, OnInit, Input } from "@angular/core";
declare let jQuery: any;

import { SuperAdmin_ServiceProvider_Service } from "../services/adminServices/AdminServiceProvider/superadmin_serviceprovider.service";
import { EmployeeMasterService } from "../services/ProviderAdminServices/employee-master-service.service";
import { ConfirmationDialogsService } from "../services/dialog/confirmation.service";
import { dataService } from '../services/dataService/data.service';

@Component({
  selector: "app-new-service-provider-setup",
  templateUrl: "./new-service-provider-setup.component.html",
  styleUrls: ["./new-service-provider-setup.component.css"]
})
export class NewServiceProviderSetupComponent implements OnInit {
  @Input() current_language: any;
  currentlanguage: any;
  username_status: any;
  showHint: boolean;
  username_dependent_flag: boolean;
  isExistAdhaar: boolean = false;

  /** ngModels*/

  serviceProviderName: any = "";
  validTill: any = "";
  contactPerson: any = "";
  contactNumber: any = "";
  emailID: any = "";
  address1: any = "";
  address2: any = "";

  state: any = "";
  service: any = "";

  title: any = "";
  gender: any = "";
  dob: any = "";
  doj: any = "";
  firstname: any = "";
  middlename: any = "";
  lastname: any = "";
  username: any = "";
  password: any = "";
  providerAdmin_EmailID: any = "";
  providerAdmin_PhoneNumber: any = "";
  aadhaar_number: any;
  pan_number: any;
  idMessage: string;
  patternAadhaar: any = /^\d{4}\d{4}\d{4}$/;
  patternPan: any = /^[A-Za-z0-9]{10}$/;
  countryID: any;
  states: any;
  servicelines: any;
  servicelines_copy: any = [];
  today: Date;
  minDate: Date;
  emailPattern: any;
  userNamePattern: any;
  passwordPattern: any;
  maxJoining: any;
  maxBirth: any;
  isExistPan: boolean = false;
  // arrays
  titles: any;
  genders: any;
  show1: boolean = true;
  show2: boolean = false;
  show3: boolean = false;
  providerNameExist: boolean = false;
  request_object: any = {};
  providerListArray: any = [];
  showAdd: boolean = false;
  validFrom: any = "";
  status: any;
  Campaign: any;
  campaings: any = [];
  constructor(
    public super_admin_service: SuperAdmin_ServiceProvider_Service,
    public EmployeeMasterService: EmployeeMasterService,
    private message: ConfirmationDialogsService,
    public commonAppData: dataService
  ) {
    this.countryID = 1;

    this.currentlanguage = {};

    this.showHint = false;
    this.username_dependent_flag = true;

  }

  ngOnInit() {

    this.today = new Date();
    this.validFrom = this.today;
    this.validTill = this.today;
    this.minDate = this.today;
    this.doj = this.today;
    this.maxJoining = this.today;
    this.dob = new Date();
    this.dob.setFullYear(this.today.getFullYear() - 20);
    console.log(this.dob);
    this.maxBirth = new Date();
    this.maxBirth.setFullYear(this.today.getFullYear() - 20);
    this.emailPattern = /^[0-9a-zA-Z_.]+@[a-zA-Z_]+?\.\b(org|com|COM|IN|in|co.in)\b$/;
    this.userNamePattern = /^[0-9a-zA-Z]+[0-9a-zA-Z-_.]+[0-9a-zA-Z]$/;
    this.passwordPattern = /^(?=.*[0-9])(?=.*[A-Z])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,12}$/;
    this.super_admin_service
      .getAllStates(this.countryID)
      .subscribe(response => (this.states = this.successhandeler(response)));
    this.super_admin_service
      .getAllServiceLines()
      .subscribe(
      response => (this.getServicesSuccessHandeler(response))
      );
    this.super_admin_service
      .getCommonRegistrationData()
      .subscribe(response => this.reg_data_successhandeler(response));
    this.requestObject();
    this.super_admin_service
      .getAllProvider()
      .subscribe(response => this.providerData_successHandler(response));
    this.getStatus();
  }

  ngOnChanges() {
    this.setLanguage(this.current_language);
  }

  changeMinJoiningDate(dob) {
    console.log("date change wala function chala", dob, new Date());
    // this.maxJoining.setDate( dob.getDate());
    // this.maxJoining.setMonth( dob.getMonth(),dob.getDate());
    this.maxJoining.setFullYear(dob.getFullYear() + 20, dob.getMonth(), dob.getDate());
    console.log(this.maxJoining, "post change");
    // this.doj = this.maxJoining;
    this.maxJoining = new Date(this.maxJoining);
  }

  preventTyping(e: any) {

    if (e.keyCode === 9) {

      return true;

    } else {

      return false;

    }

  }

  getServicesSuccessHandeler(response) {
    this.servicelines = response;
    this.servicelines_copy = response;

  }

  setGenderOnCondition(title) {
    if (title === 2 || title === 4 || title === 5 || title === 13) {
      this.gender = 2;
    }
    else if (title === 3 || title === 8) {
      this.gender = 1;
    }
    else {
      this.gender = "";
    }
  }

  requestObject() {
    this.request_object = {
      serviceProviderName: "",
      // stateId: null,
      logoFileName: "",
      logoFilePath: "",
      primaryContactName: "",
      primaryContactNo: "",
      primaryContactEmailID: "",
      primaryContactAddress: "",
      secondaryContactName: "",
      secondaryContactNo: "",
      secondaryContactEmailID: "",
      secondaryContactAddress: "",
      statusID: "2",
      createdBy: this.commonAppData.uname,
      validTill: "",
      validFrom: "",
      stateAndServiceMapList: [],
      providerAdminDetails: []
    };
  }
  reg_data_successhandeler(response) {
    console.log("common registration", response);
    this.titles = response.m_Title;
    this.genders = response.m_genders;
  }

  setLanguage(language) {
    this.currentlanguage = language;
    console.log(language, "language");
  }

  successhandeler(response) {
    console.log(response, "**");
    return response;
  }

  resetNGmodules() {
    this.serviceProviderName = "";
    this.validTill = "";
    this.contactPerson = "";
    this.contactNumber = "";
    this.emailID = "";
    this.address1 = "";
    this.address2 = "";
    this.validFrom = "";
    this.state = "";
    this.service = "";

    this.title = "";
    this.gender = "";
    this.dob = "";
    this.doj = "";
    this.firstname = "";
    this.middlename = "";
    this.lastname = "";
    this.username = "";
    this.password = "";
    this.providerAdmin_EmailID = "";
    this.providerAdmin_PhoneNumber = "";
  }

  show(val: number, action: string) {
    if (val == 1 && action === "back") {
      this.show1 = true;
      this.show2 = false;
      this.show3 = false;
    }

    if (val == 2 && action === 'save') {
      this.show1 = false;
      this.show2 = true;
      this.show3 = false;

      // setting of some details in screen one to screen 3 (pre-population)
      this.firstname = this.contactPerson;
      this.providerAdmin_EmailID = this.emailID;
      this.providerAdmin_PhoneNumber = this.contactNumber;

      this.request_object.serviceProviderName = this.serviceProviderName;
      this.request_object.validTill = new Date(
        this.validTill - 1 * (this.validTill.getTimezoneOffset() * 60 * 1000)
      ).toJSON();
      this.request_object.validFrom = new Date(
        this.validFrom - 1 * (this.validFrom.getTimezoneOffset() * 60 * 1000)
      ).toJSON();
      this.request_object.primaryContactName = this.contactPerson;
      this.request_object.primaryContactNo = this.contactNumber;
      this.request_object.primaryContactEmailID = this.emailID;
      this.request_object.primaryContactAddress =
        ((this.address1 !== undefined && this.address1 !== null) ? this.address1.trim() : this.address1) + ',' + 
        ((this.address2 !== undefined && this.address2 !== null) ? this.address2.trim() : this.address2);
    }

    if (val == 2 && action === 'back') {
      this.show1 = false;
      this.show2 = true;
      this.show3 = false;
    }

    if (val == 3 && action === 'save') {
      this.show1 = false;
      this.show2 = false;
      this.show3 = true;
      // this.state_service_array = this.state_service_array.map(function (item) {
      //   return {
      //     'stateId': item.stateId.toString(), 'services': item.services.map(function (serviceItem) {
      //       return serviceItem.serviceID.toString();
      //     })
      //   }
      // });
      console.log('Object is', JSON.stringify(this.state_service_array));
      this.request_object.stateAndServiceMapList = this.state_service_array;
    }
  }

  // section 1
  selectedService(value) {
    if (value.length > 0) {
      this.showAdd = true;
    } else {
      this.showAdd = false;
    }
  }

  // section 2
  showService() {
    this.service = '';
    this.showAdd = false;
    this.showServiceline = true;
  }

  showTable: boolean = false;

  showServiceline: boolean = false;
  state_service_array: any = [];

  add_2_state_service_array(state, services) {
    this.showServiceline = false;
    let data_obj = {
      stateId: state.stateID,
      stateName: state.stateName,
      services: services
    };

    /*need DISCUSSION DO NOT DELETE SECTION-starts*/
    // this.check1097ServiceExistance(data_obj.services);
    /*need DISCUSSION DO NOT DELETE SECTION-ends*/


    /** NOTE
		if services are already mentioned for that state in that transaction,
		dont add it in the  'state_service_array'
	`       */

    /** if the state_service_array is not empty, CHECK if that has an OBJ 
		for a particular state
			*/
    // if (this.state_service_array.length > 0) {
    // 	this.state_service_array = this.state_service_array.filter(function (item) {
    // 		;
    // 		return item !== data_obj
    // 	}).map(function (data) {
    // 		;
    // 		return data;
    // 	});
    // 	if()
    // }
    // else {
    // 	if (data_obj.stateId != "") {
    // 		this.state_service_array.push(data_obj);
    // 	}

    // 	console.log(this.state_service_array);
    // }

    if (this.state_service_array.length > 0) {
      let count = 0;
      for (let i = 0; i < this.state_service_array.length; i++) {
        if (this.state_service_array[i].stateId === data_obj.stateId) {
          data_obj.services = data_obj.services.filter(
            val => !this.state_service_array[i].services.includes(val)
          );
          if (data_obj.services.length === 0) {
            count = count + 1;
          }
          // else {
          //   count = count + 1;
          //   this.state_service_array[i].services.push(data_obj.services);
          // }
        }
      }
      /** counter will not increase if an obj for that state is not there*/
      if (count === 0) {
        if (data_obj.stateId != '') {
          this.state_service_array.push(data_obj);
        }
      }
    } else {
      /** if blank array, enter obj as it is */
      if (data_obj.stateId != '') {
        this.state_service_array.push(data_obj);
      }

      console.log(this.state_service_array);
    }

    /** once data is pushed in the table array..do the following */

    jQuery('#addServiceLines').trigger('reset');
    this.service = '';
    this.showTable = true;
    this.showAdd = false;
  }


  /*NEED DISCUSSION---DONT DELETE SECTION--starts*/

  /*check1097ServiceExistance(selected_services){
    console.log("selected services",selected_services);

    for(let i=0;i<selected_services.length;i++)
    {
      if(selected_services[i].serviceID===1 || selected_services[i].serviceName==="1097")
      {
        this.servicelines=this.servicelines.filter(function(service)
        {
          if(service.serviceID!=1)
          {
            return service;
          }
        });

        break;
      }

    }

  }*/

  /*NEED DISCUSSION---DONT DELETE SECTION--ends*/



  remove_from_state_service_array(index) {
    this.state_service_array.splice(index, 1);
    if (this.state_service_array.length == 0) {
      this.showTable = false;
    }
  }

  resetArray() {
    this.state_service_array = [];
  }

  // section 3

  finalSubmit() {
    console.log(this.dob);
    let provider_admin_details_obj = {};

    provider_admin_details_obj['firstName'] = this.firstname;
    provider_admin_details_obj['middleName'] = this.middlename;
    provider_admin_details_obj['lastName'] = this.lastname;
    provider_admin_details_obj['emailID'] = this.providerAdmin_EmailID;
    provider_admin_details_obj['mobileNo'] = this.providerAdmin_PhoneNumber;
    provider_admin_details_obj['userName'] = this.username.toLowerCase();
    provider_admin_details_obj['password'] = this.password;
    provider_admin_details_obj['titleID'] = this.title.toString();
    provider_admin_details_obj['genderID'] = this.gender.toString();
    // provider_admin_details_obj['roleID'] = 11;
    this.dob;
    (this.address1 !== undefined && this.address1 !== null) ? this.address1.trim() : this.address1;
    provider_admin_details_obj['dob'] = new Date(
      this.dob - 1 * (this.dob.getTimezoneOffset() * 60 * 1000)
    ).toJSON();
    provider_admin_details_obj['doj'] = new Date(
      this.doj - 1 * (this.doj.getTimezoneOffset() * 60 * 1000)
    ).toJSON();
    provider_admin_details_obj['maritalStatusID'] = '';

    if (this.aadhaar_number !== undefined && this.aadhaar_number !== null && this.aadhaar_number.trim().length > 0) {
      provider_admin_details_obj['aadharNo'] = this.aadhaar_number;
    }

    if (this.pan_number !== undefined && this.pan_number !== null && this.pan_number.trim().length > 0) {
      provider_admin_details_obj['panNo'] = this.pan_number;
    }

    // provider_admin_details_obj['panNo'] = this.pan_number
    //   ? this.pan_number
    //   : '';
    provider_admin_details_obj['qualificationID'] = undefined;
    provider_admin_details_obj['emrContactPersion'] = undefined;
    provider_admin_details_obj['emrConctactNo'] = undefined;
    ;
    provider_admin_details_obj['statusID'] = this.status[0].statusID.toString();

    this.request_object.stateAndServiceMapList = this.request_object.stateAndServiceMapList.map(function (item) {
      console.log(item);
      return {
        'stateId': item.stateId.toString(), 'services': item.services.map(function (serviceItem) {
          return serviceItem.serviceID.toString();
        })
      }
    });
    this.request_object.createdBy = this.commonAppData.uname;
    this.request_object.providerAdminDetails.push(provider_admin_details_obj);
    console.log(JSON.stringify(this.request_object));
    console.log(this.request_object, 'REQUEST OBJECT IN SUPER ADMIN FOR PROVIDER CREATION');
    this.super_admin_service
      .createServiceProvider(this.request_object)
      .subscribe(
      response => this.successHandeler(response),
      err => {
        this.message.alert('Error in Adding Provider');
      }
      );
  }

  successHandeler(response) {
    console.log(
      response.response,
      'in TS, the response after having sent req for creating service provider'
    );
    if (response.response.toLowerCase() === 'true'.toLowerCase()) {
      this.message.alert('Saved successfully');
      this.show1 = true;
      this.show2 = false;
      this.show3 = false;
      this.clearFullForm();
      this.requestObject();
    }
  }
  deleteServiceLine(parentIndex: number, index: number, service_name) {
    this.state_service_array[parentIndex].services.splice(index, 1);
    if (this.state_service_array[parentIndex].services.length === 0) {
      this.state_service_array.splice(parentIndex, 1);
    }
    if (this.state_service_array.length === 0) {
      this.showTable = false;
    }

    if (service_name === "1097") {
      this.clr();
    }
  }
  checkProviderNameAvailability(service_provider_name) {
    this.super_admin_service
      .checkProviderNameAvailability(service_provider_name)
      .subscribe(response =>
        this.checkProviderNameAvailibilityHandeler(response)
      );
    // for(var i=0; i<this.providerListArray.length; i++) {
    //   if(this.providerListArray[i].serviceProviderName.toLowerCase() === service_provider_name.toLowerCase()){
    //       this.providerNameExist = true;
    //       ;
    //   }
    //   else  {
    //     this.providerNameExist = false;
    //   }
    // }
  }

  checkProviderNameAvailibilityHandeler(response) {
    console.log(response.response, 'provider name availability');
    if (response.response === 'provider_name_exists') {
      this.providerNameExist = true;
    } else {
      this.providerNameExist = false;
    }
  }

  checkUsernameExists(username) {
    this.EmployeeMasterService
      .checkUsernameExists(username)
      .subscribe(response => this.checkUsernameSuccessHandeler(response));
  }

  checkUsernameSuccessHandeler(response) {
    console.log(this.username, 'uname');
    console.log('username existance status', response);
    if (response === 'userexist') {
      this.username_status = 'User Login ID Exists!! Type Different Please!';
      this.showHint = true;
      this.username_dependent_flag = true;
    }
    if (response === 'usernotexist') {
      if (
        this.username != '' &&
        (this.username != undefined && this.username != null)
      ) {
        this.showHint = false;
        this.username_dependent_flag = false;
      } else {
        this.showHint = true;
        this.username_dependent_flag = true;
        this.username_status = 'Username can\'t be blank';
      }
    }
  }
  checkAdhaarSuccessHandler(response) {
    if (response === 'true') {
      this.isExistAdhaar = true;
      this.idMessage = 'Adhaar Number Already Exists';
    } else {
      this.isExistAdhaar = false;
      this.idMessage = '';
    }
  }
  checkPanSuccessHandler(response) {
    if (response === 'true') {
      this.isExistPan = true;
      this.idMessage = 'Pan Number Already Exists';
    } else {
      this.isExistPan = false;
      this.idMessage = '';
    }
  }
  // to check whether the object are same
  isEquivalent(a: any, b: any) {
    // Create arrays of property names
    let aProps = Object.getOwnPropertyNames(a);
    let bProps = Object.getOwnPropertyNames(b);

    // If number of properties is different,
    // objects are not equivalent
    if (aProps.length != bProps.length) {
      return false;
    }

    for (let i = 0; i < aProps.length; i++) {
      let propName = aProps[i];

      // If values of same property are not equal,
      // objects are not equivalent
      if (a[propName] !== b[propName]) {
        return false;
      }
    }

    // If we made it this far, objects
    // are considered equivalent
    return true;
  }
  checkAdhaar() {
    this.EmployeeMasterService.validateAdhaar(this.aadhaar_number).subscribe(
      (response: any) => {
        this.checkAdhaarSuccessHandler(response);
      },
      err => { }
    );
  }
  checkPan() {
    this.EmployeeMasterService.validatePan(this.pan_number).subscribe(
      response => {
        this.checkPanSuccessHandler(response);
      },
      err => { }
    );
  }
  clearFullForm() {
    jQuery('#providerForm').trigger('reset');
    jQuery('#detailedForm').trigger('reset');
    this.state_service_array = [];
    this.show1 = true;
    this.show3 = false;
    this.today = new Date();
    this.validTill = this.today;
    this.validFrom = this.today;
    this.doj = this.today;
    this.dob = new Date();
    this.dob.setFullYear(this.today.getFullYear() - 20);
    this.showTable = false;
    this.address1 = '';
    this.address2 = '';
    this.contactPerson = '';
    this.middlename = '';
    this.providerAdmin_PhoneNumber = '';
    this.providerAdmin_EmailID = '';
  }
  getStatus() {
    this.super_admin_service.getAllStatus().subscribe(
      res => {
        this.status = res.filter(function (serviceItem) {
          return serviceItem.status.toLowerCase() === 'new';
        });
      },
      err => { }
    );
  }
  clearProviderForm() {
    this.message.confirm('Confirm','Are you sure want to clear?').subscribe(
      response => {
        if (response) {
          jQuery('#detailedForm').trigger('reset');
          // this.state_service_array = [];
          // this.show1 = true;
          // this.show3 = false;
          this.today = new Date();
          this.dob = this.today;
          this.dob.setFullYear(this.today.getFullYear() - 20);
          this.doj = new Date();
        }
      },
      err => { }
    );
    // jQuery('#providerForm').trigger('reset');
  }
  clearDetailedForm() {
    this.message.confirm('Confirm','Are you sure want to clear?').subscribe(
      response => {
        if (response) {
          jQuery('#providerForm').trigger('reset');
          this.validTill = new Date();
          this.validFrom = new Date();
        }
      },
      err => { }
    );
  }

  clr() {
    /*do not delete...needs discussion---START*/
    // this.servicelines=this.servicelines_copy;
  }

  providerData_successHandler(res) {
    this.providerListArray = res;
  }
  validFromD(date) {
    console.log(this.today);
    console.log(date);
    this.validTill = date;
  }
  getCampaingns() {
    // this.super_admin_service.getCampaingns().subscribe(
    //   res => {
    //   },
    //   err => { }
    // );
  }
}
