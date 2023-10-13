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

@Injectable()

export class EmployeeMasterNewServices {

    // Base Urls
    providerAdmin_base_url: any
    common_base_url: any;

    // Urls - Fetching dropdown related data
    // getAllTitlesUrl: any;
    // getAllGendersUrl: any;
    getAllUsersUrl: any;
    getAllDesignationsUrl: any;
    getAllMaritalStatusesUrl: any;
    getAllQualificationsUrl: any;
    getRegistrationDataUrl: any;
    getAllCommunitiesUrl: any;
    getAllReligionsUrl: any;
    getAllStatesUrl: any;
    getAllDistrictsUrl: any;
    checkUserAvailabilityUrl: any;
    checkID: any;
    createNewUserUrl: any;
    editUserDetailsUrl: any;
    userActivationDeactivationUrl: any;
    checkEmpIdAvailabilityUrl: any;

    constructor(private http: InterceptedHttp,
        public basePaths: ConfigService,
        private httpSecurity: SecurityInterceptedHttp) {
        this.providerAdmin_base_url = this.basePaths.getAdminBaseUrl();
        this.common_base_url = this.basePaths.getCommonBaseURL();

        // APIs - For Employee Master New
        this.getRegistrationDataUrl = this.common_base_url + 'beneficiary/getRegistrationData';
        this.checkUserAvailabilityUrl = this.providerAdmin_base_url + 'm/FindEmployeeByName';
        this.getAllUsersUrl = this.providerAdmin_base_url + 'm/SearchEmployee4';
        this.getAllDesignationsUrl = this.providerAdmin_base_url + 'm/getDesignation';
        this.getAllMaritalStatusesUrl = this.common_base_url + 'beneficiary/getRegistrationDataV1';
        this.getAllQualificationsUrl = this.providerAdmin_base_url + 'm/Qualification';
        this.getAllCommunitiesUrl = this.providerAdmin_base_url + 'getCommunity';
        this.getAllReligionsUrl = this.providerAdmin_base_url + 'getReligion';
        this.getAllStatesUrl = this.common_base_url + 'location/states/';
        this.getAllDistrictsUrl = this.common_base_url + 'location/districts/';
        this.checkID = this.providerAdmin_base_url + 'm/FindEmployeeDetails';
        this.createNewUserUrl = this.providerAdmin_base_url + 'createNewUser';
        this.editUserDetailsUrl = this.providerAdmin_base_url + 'editUserDetails';
        this.userActivationDeactivationUrl = this.providerAdmin_base_url + 'deletedUserDetails';
        this.checkEmpIdAvailabilityUrl = this.providerAdmin_base_url + '/m/FindEmployeeDetails';
    }
    // User Details related methods for fetching all dropdown data
    getCommonRegistrationData() {
        return this.httpSecurity
            .post(this.getRegistrationDataUrl, {})
            .map(this.extractData)
            .catch(this.handleError);
    }
    getAllUsers(serviceProviderID) {
        return this.http
            .post(this.getAllUsersUrl, { 'serviceProviderID': serviceProviderID })
            .map(this.extractData)
            .catch(this.handleError)
    }
    checkUserAvailability(name) {
        return this.httpSecurity
            .post(this.checkUserAvailabilityUrl, {
                'userName': name
            })
            .map(this.extractData)
            .catch(this.handleError)
    }
    checkEmpIdAvailability(empID) {
        return this.httpSecurity
            .post(this.checkEmpIdAvailabilityUrl, { 'employeeID': empID })
            .map(this.extractData)
            .catch(this.handleError)
    }
    getAllDesignations() {
        return this.httpSecurity
            .post(this.getAllDesignationsUrl, {})
            .map(this.extractData)
            .catch(this.handleError)
    }
    getAllMaritalStatuses() {
        return this.httpSecurity
            .post(this.getAllMaritalStatusesUrl, {})
            .map(this.extractData)
            .catch(this.handleError)
    }
    getAllQualifications() {
        return this.httpSecurity
            .post(this.getAllQualificationsUrl, {})
            .map(this.extractData)
            .catch(this.handleError)
    }
    getAllCommunities() {
        return this.httpSecurity
            .post(this.getAllCommunitiesUrl, {})
            .map(this.extractData)
            .catch(this.handleError)
    }
    getAllReligions() {
        return this.httpSecurity
            .post(this.getAllReligionsUrl, {})
            .map(this.extractData)
            .catch(this.handleError)
    }
    getAllStates(countryId) {
        console.log("COuntryID:", countryId);
        return this.httpSecurity
            .get(this.getAllStatesUrl + countryId)
            .map(this.extractData)
            .catch(this.handleError)
    }
    getAllDistricts(stateID) {
        console.log("stateID", stateID);

        return this.httpSecurity
            .get(this.getAllDistrictsUrl + stateID)
            .map(this.extractData)
            .catch(this.handleError)
    }
    validateAadhar(idNumber: any) {
        return this.httpSecurity
            .post(this.checkID, { 'aadhaarNo': idNumber })
            .map(this.extractCustomData)
            .catch(this.handleError);
    }
    validatePan(idNumber: any) {
        return this.httpSecurity
            .post(this.checkID, { 'pAN': idNumber })
            .map(this.extractCustomData)
            .catch(this.handleError);
    }
    validateHealthProfessionalID(idNumber: any) {
        return this.httpSecurity
            .post(this.checkID, { 'healthProfessionalID': idNumber })
            .map(this.extractCustomData)
            .catch(this.handleError);
    }
    createNewUser(reqObject) {
        console.log("service", reqObject);

        return this.http
            .post(this.createNewUserUrl, reqObject)
            .map(this.extractData)
            .catch(this.handleError)
    }
    editUserDetails(updateObj) {
        return this.http
            .post(this.editUserDetailsUrl, updateObj)
            .map(this.extractData)
            .catch(this.handleError)
    }
    userActivationDeactivation(toggle_obj) {
        console.log("toggle_obj", toggle_obj);
        return this.http
            .post(this.userActivationDeactivationUrl, toggle_obj)
            .map(this.extractData)
            .catch(this.handleError)
    }








    private extractCustomData(res: Response) {
        if (res.json().data) {
            console.log('Employee Master New Service', res.json().data);
            return res.json().data;
        } else {
            return Observable.throw(res.json());
        }
    }
    private extractData(res: Response) {
        if (res.json().data && res.json().statusCode == 200) {
            console.log('Employee Master New Service', res.json(), res.json().data);
            return res.json().data;
        } else {
            return Observable.throw(res.json());
        }
    }
    private handleCustomError(error: Response | any) {
        return Observable.throw(error.json());
    }
    private handleError(error: Response | any) {
        return Observable.throw(error.json());
    }

}