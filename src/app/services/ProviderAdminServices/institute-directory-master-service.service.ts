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
import { ConfigService } from '../config/config.service';
import { SecurityInterceptedHttp } from '../../http.securityinterceptor';




/**
 * Author: Diamond Khanna ( 352929 )
 * Date: 09-10-2017
 * Objective: # A service which would handle the INSTITUTE DIRECTORY MASTER services.
 */

@Injectable()
export class InstituteDirectoryMasterService {
	admin_Base_Url: any;

	get_InstituteDirectory_Url: any;
	save_InstituteDirectory_Url: any;
	save_Cdss_Mapping: any;
	edit_InstituteDirectory_Url: any;
	toggle_activate_InstituteDirectory_Url: any;
	getServiceLines_new_url: any;
	getStates_new_url: any;
	get_Cdss_Url: any;

	constructor(private http: SecurityInterceptedHttp,
		public basepaths: ConfigService,
		private httpIntercept: InterceptedHttp) {
		this.admin_Base_Url = this.basepaths.getAdminBaseUrl();

		this.get_InstituteDirectory_Url = this.admin_Base_Url + 'm/getInstituteDirectory';
		this.save_InstituteDirectory_Url = this.admin_Base_Url + 'm/createInstituteDirectory';
		this.save_Cdss_Mapping = this.admin_Base_Url+ 'uptsu/submit/cdss';
		this.get_Cdss_Url = this.admin_Base_Url+ 'uptsu/getCdssData';
		this.edit_InstituteDirectory_Url = this.admin_Base_Url + 'm/editInstituteDirectory';
		this.toggle_activate_InstituteDirectory_Url = this.admin_Base_Url + 'm/deleteInstituteDirectory';

		this.getServiceLines_new_url = this.admin_Base_Url + 'm/role/serviceNew';
		this.getStates_new_url = this.admin_Base_Url + 'm/role/stateNew';
	};

	getStatesNew(obj) {
		return this.httpIntercept.post(this.getStates_new_url, obj).map(this.handleSuccess)
			.catch(this.handleError);
	}

	getServiceLinesNew(userID) {
		return this.httpIntercept.post(this.getServiceLines_new_url, { 'userID': userID })
			.map(this.handleState_n_ServiceSuccess)
			.catch(this.handleError);
	}
	getServiceLinesNewCdss(userID) {
		return this.httpIntercept.post(this.getServiceLines_new_url, { 'userID': userID })
			.map(this.handleStateCdss)
			.catch(this.handleError);
	}

	saveCdssMapping(reqObj){
		console.log('save Institute Directory', reqObj);
		return this.httpIntercept.post(this.save_Cdss_Mapping, reqObj).map(this.handleSuccess).catch(this.handleError);
	}
	getCdssDetails(providerServiceMapID) {
		console.log('psmID', providerServiceMapID);
		return this.httpIntercept.get(this.get_Cdss_Url + '/'+ providerServiceMapID,
			).map(this.handleSuccess).catch(this.handleError);
	}
	getInstituteDirectory(providerServiceMapID) {
		console.log('psmID', providerServiceMapID);
		return this.httpIntercept.post(this.get_InstituteDirectory_Url,
			{ 'providerServiceMapId': providerServiceMapID }).map(this.handleSuccess).catch(this.handleError);
	}

	saveInstituteDirectory(data) {
		console.log('save Institute Directory', data);
		return this.httpIntercept.post(this.save_InstituteDirectory_Url, data).map(this.handleSuccess).catch(this.handleError);
	}

	editInstituteDirectory(data) {
		return this.httpIntercept.post(this.edit_InstituteDirectory_Url, data).map(this.handleSuccess).catch(this.handleError);
	}

	toggle_activate_InstituteDirectory(data) {
		console.log(data, 'delete req obj');
		return this.httpIntercept.post(this.toggle_activate_InstituteDirectory_Url, data).map(this.handleSuccess).catch(this.handleError);
	}


	handleSuccess(res: Response) {
		console.log(res.json().data, 'INSTITUTE-DIRECTORY file success response');
		if (res.json().data) {
			return res.json().data;
		} else {
			return Observable.throw(res.json());
		}
	}

	handleState_n_ServiceSuccess(response: Response) {

		console.log(response.json().data, 'role service file success response');
		let result = [];
		result = response.json().data.filter(function (item) {
			if (item.serviceID === 3 || item.serviceID === 1 || item.serviceID === 6) {
				return item;
			}
		});
		return result;
	}

	handleStateCdss(response: Response) {

		console.log(response.json().data, 'role service file success response');
		let result = [];
		result = response.json().data.filter(function (item) {
			if (item.serviceID === 9) {
				return item;
			}
		});
		return result;
	}

	handleError(error: Response | any) {
		return Observable.throw(error.json());
	}
};



