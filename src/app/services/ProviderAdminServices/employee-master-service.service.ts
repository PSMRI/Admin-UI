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
import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import { InterceptedHttp } from '../../http.interceptor';
import { SecurityInterceptedHttp } from '../../http.securityinterceptor';

import { ConfigService } from '../config/config.service';



/**
 * Author: Diamond Khanna ( 352929 )
 * Date: 24-07-2017
 * Objective: # A service which would handle the creation of employees and their
               role provisioning
                */
@Injectable()
export class EmployeeMasterService {

  providerAdmin_Base_Url: any;
  common_Base_Url: any;

  //  CRUD
  createEmployeeUrl: any;
  editEmployeeUrl: any;
  deleteEmployeeUrl: any;
  getEmployeeUrl: any;

  // data filling helper-api urls
  getRegistrationDataUrl: any;
  get_Service_Url: any;

  getAllQualificationsUrl: any;  // mbbs,btech,mtech   as of now not there/neither wanted acc to ppl

  getAllDistrictsInStateUrl: any;

  getAllStatesOfServiceProviderUrl: any;
  getAllWorkLocationsInStateUrl: any;
  getAllServiceLinesInWorkLocationUrl: any;
  getAllRolesInServiceLine: any;

  checkUsernameUrl: any;

  // search ka samaan
  getServicesUrl: any;
  find_Roles_Url: any;
  checkID: any;
  deleteRoleUrl: any;
  getDesignationsUrl: any;



  constructor(private http: SecurityInterceptedHttp,
    public basepaths: ConfigService,
    private httpIntercept: InterceptedHttp) {
    this.providerAdmin_Base_Url = this.basepaths.getAdminBaseUrl();
    this.common_Base_Url = this.basepaths.getCommonBaseURL();

    this.createEmployeeUrl = this.providerAdmin_Base_Url + 'm/AddEmployee';
    this.editEmployeeUrl = this.providerAdmin_Base_Url + 'm/editEmployee';
    // this.deleteEmployeeUrl = this.providerAdmin_Base_Url + "m/deleteEmployee";
    this.deleteRoleUrl = this.providerAdmin_Base_Url + '/m/deleteEmployeeRole';
    this.getEmployeeUrl = this.providerAdmin_Base_Url + 'm/SearchEmployeeFilter';

    this.getRegistrationDataUrl = this.common_Base_Url + 'beneficiary/getRegistrationData';
    this.getAllDistrictsInStateUrl = this.common_Base_Url + 'location/districts/';
    this.getAllStatesOfServiceProviderUrl = this.providerAdmin_Base_Url + 'm/role/state';
    this.get_Service_Url = this.providerAdmin_Base_Url + 'm/role/service';
    this.getAllQualificationsUrl = this.providerAdmin_Base_Url + 'm/Qualification';
    this.getAllWorkLocationsInStateUrl = this.providerAdmin_Base_Url + 'm/location/getAlllocation';
    // this.getAllServiceLinesInWorkLocationUrl = "";
    this.getAllRolesInServiceLine = this.providerAdmin_Base_Url + 'm/role/search';

    this.checkUsernameUrl = this.providerAdmin_Base_Url + 'm/FindEmployeeByName';

    // newcontent for search
    this.getServicesUrl = this.providerAdmin_Base_Url + 'm/role/service';
    this.find_Roles_Url = this.providerAdmin_Base_Url + 'm/role/search1';
    this.checkID = this.providerAdmin_Base_Url + 'm/FindEmployeeDetails';
    this.getDesignationsUrl = this.providerAdmin_Base_Url + '/m/getDesignation';

  };

  getCommonRegistrationData() {
    return this.http.post(this.getRegistrationDataUrl, {})
      .map(this.handleSuccess)
      .catch(this.handleError);
  }

  checkUsernameExists(username) {
    return this.http.post(this.checkUsernameUrl, { 'userName': username })
      .map(this.handleCustomSuccess)
      .catch(this.handleError);
  }

  getDistricts(stateID) {
    return this.http.get(this.getAllDistrictsInStateUrl + stateID)
      .map(this.handleSuccess)
      .catch(this.handleError);
  }

  getQualifications() {
    return this.http.post(this.getAllQualificationsUrl, {})
      .map(this.handleSuccess)
      .catch(this.handleError);
  }

  // worklocation specific
  getStatesOfServiceProvider(serviceProviderID) {
    return this.http.post(this.getAllStatesOfServiceProviderUrl,
      { 'serviceProviderID': serviceProviderID })
      .map(this.handleState_n_ServiceSuccess)
      .catch(this.handleError);
  }

  getServicesOfServiceProvider(serviceProviderID, stateID) {
    return this.http.post(this.get_Service_Url,
      { 'serviceProviderID': serviceProviderID, 'stateID': stateID })
      .map(this.handleState_n_ServiceSuccess)
      .catch(this.handleError);
  }

  getWorkLocationsInState(serviceProviderID, stateID, serviceID) {
    return this.http.post(this.getAllWorkLocationsInStateUrl,
      { 'serviceProviderID': serviceProviderID, 'stateID': stateID, 'serviceID': serviceID })
      .map(this.handleSuccess)
      .catch(this.handleError);
  }

  getServiceLinesInWorkLocation() {
    return this.http.post(this.getAllServiceLinesInWorkLocationUrl, {})
      .map(this.handleSuccess)
      .catch(this.handleError);
  }

  validateAdhaar(idNumber: any) {
    return this.http.post(this.checkID, { 'aadhaarNo': idNumber })
      .map(this.handleCustomSuccess)
      .catch(this.handleError);
  }


  validatePan(idNumber: any) {
    return this.http.post(this.checkID, { 'pAN': idNumber })
      .map(this.handleCustomSuccess)
      .catch(this.handleError);
  }



  getRolesInServiceLine(serviceProviderID, stateID, serviceID) {
    return this.http.post(this.getAllRolesInServiceLine,
      {
        'serviceProviderID': serviceProviderID,
        'stateID': stateID,
        'serviceID': serviceID
      })
      .map(this.handleSuccess)
      .catch(this.handleError);
  }

  getServices(serviceProviderID, stateID) {
    return this.http.post(this.getServicesUrl, {
      'serviceProviderID': serviceProviderID,
      'stateID': stateID
    })
      .map(this.handleState_n_ServiceSuccess)
      .catch(this.handleError);
  }

  getRoles(serviceProviderID, stateID, serviceID) {
    return this.http.post(this.find_Roles_Url,
      {
        'serviceProviderID': serviceProviderID,
        'stateID': stateID,
        'serviceID': serviceID
      })
      .map(this.handleSuccess)
      .catch(this.handleError);

  }

  // CRUD begins
  createEmployee(requestObject) {
    console.log(requestObject, 'request obj in service')
    return this.httpIntercept.post(this.createEmployeeUrl, JSON.parse(requestObject))
      .map(this.handleSuccess)
      .catch(this.handleError);
  }

  editEmployee(requestObject) {
    return this.httpIntercept.post(this.editEmployeeUrl, requestObject)
      .map(this.handleSuccess)
      .catch(this.handleError);
  }

  deleteEmployeeRole(usrMapID) {
    return this.httpIntercept.post(this.deleteRoleUrl, { 'uSRMappingID': usrMapID })
      .map(this.handleSuccess)
      .catch(this.handleError);
  }

  getEmployees(requestObject) {
    return this.httpIntercept.post(this.getEmployeeUrl, requestObject)
      .map(this.handleSuccess)
      .catch(this.handleError);
  }


  handleCustomSuccess(response: Response) {
    console.log(response.json().data, '--- in employee master SERVICE');
    return response.json().data.response;
  }

  getDesignations() {
    return this.http.post(this.getDesignationsUrl, {})
      .map(this.handleSuccess)
      .catch(this.handleError);
  }
  handleSuccess(res: Response) {
    console.log(res.json().data, '--- in employee master SERVICE');
    if (res.json().data) {
      return res.json().data;
    } else {
      return Observable.throw(res.json());
    }
  }

  handleState_n_ServiceSuccess(response: Response) {

    console.log(response.json().data, 'employee master service response');
    let result = [];
    result = response.json().data.filter(function (item) {
      if (item.statusID !== 4) {
        return item;
      }
    });
    return result;
  }

  handleError(error: Response | any) {
    return Observable.throw(error.json());
  }
};



