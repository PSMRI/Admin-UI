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
import { ConfigService } from "../config/config.service";
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import { InterceptedHttp } from './../../http.interceptor';
import { SecurityInterceptedHttp } from '../../http.securityinterceptor';


@Injectable()
export class loginService {
	_baseURL = this._config.getCommonBaseURL();
	adminUrl = this._config.getAdminBaseUrl();
	_userAuthURL = this._baseURL + "user/userAuthenticate/";
	redis_session_removal_url = this._baseURL + 'user/userLogout';

	superadmin_auth_url = this._baseURL + 'user/superUserAuthenticate';
	userLogoutPreviousSessionURL = this._baseURL + 'user/logOutUserFromConcurrentSession';
	_forgotPasswordURL = this._baseURL + "user/forgetPassword/";
	_validateSecurityQuestionAndAnswerURL = this._baseURL + "user/validateSecurityQuestionAndAnswer/"
	_getTransactionIdForChangePasswordURL = this._baseURL + "user/getTransactionIdForChangePassword/"
	_authorisedUser = this._baseURL + 'user/getLoginResponse';
	admin_base_path: any;
	// newlogin = "http://l-156100778.wipro.com:8080/CommonV1/user/userAuthenticate";
	newlogin = this._baseURL + "user/userAuthenticate";
	apiVersionUrl = this.adminUrl + "version";
	getServiceProviderID_url: any;
	transactionId:any;
	
	constructor(
		private _http: SecurityInterceptedHttp,
		private _httpInterceptor: InterceptedHttp,
		private _config: ConfigService
	) {
		this.admin_base_path = this._config.getAdminBaseUrl();
		this.getServiceProviderID_url = this.admin_base_path + "getServiceProviderid";
	}

	public authenticateUser = function (uname: any, pwd: any, doLogout: any) {
		return this._httpInterceptor.post(this.newlogin, { 'userName': uname.toLowerCase(), 'password': pwd, 'doLogout': doLogout })
			.map(this.extractData)
			.catch(this.handleError);
	};
	public checkAuthorisedUser() {
		return this._httpInterceptor.post(this._authorisedUser, {})
			.map(this.extractData)
			.catch(this.handleError);
	}
	superAdminAuthenticate(uname, password, doLogout) {
		return this._httpInterceptor.post(this.superadmin_auth_url, { 'userName': uname.toLowerCase(), 'password': password, 'doLogout': doLogout })
			.map(this.extractData)
			.catch(this.handleError);
	}

	userLogOutFromPreviousSession(uname) {
		return this._httpInterceptor.post(this.userLogoutPreviousSessionURL, { 'userName': uname.toLowerCase() })
			.map(this.extractData)
			.catch(this.handleError);
	}

	removeTokenFromRedis() {
		return this._http.post(this.redis_session_removal_url, {})
			.map(this.extractData)
			.catch(this.handleError);
	}

	getSecurityQuestions(uname: any): Observable<any> {

		return this._http.post(this._forgotPasswordURL, { 'userName': uname.toLowerCase() })
			.map(this.extractData)
			.catch(this.handleError);
	};

	validateSecurityQuestionAndAnswer(ans: any, uname: any): Observable<any> {

		return this._http.post(this._validateSecurityQuestionAndAnswerURL, {'SecurityQuesAns':ans, 'userName': uname.toLowerCase() })
			.map(this.extractDataForSecurity)
			.catch(this.handleError);
	};

	getTransactionIdForChangePassword(uname: any): Observable<any> {

		return this._http.post(this._getTransactionIdForChangePasswordURL, { 'userName': uname.toLowerCase() })
			.map(this.extractDataForSecurity)
			.catch(this.handleError);
	};

	getServiceProviderID(providerServiceMapID) {
		return this._http.post(this.getServiceProviderID_url, { 'providerServiceMapID': providerServiceMapID })
			.map(this.extractData)
			.catch(this.handleError);
	}
	getApiVersionDetails() {
		return this._httpInterceptor.get(this.apiVersionUrl)
			.map(res => res.json());
	}

	private extractData(res: Response) {
		// console.log("inside extractData:"+JSON.stringify(res.json()));
		// let body = res.json();
		//return body.data || {};
		console.log("response in service", res.json());
		if (res.json().data) {
			return res.json().data;
		} else {
			return Observable.throw(res.json());
		}
	};

	private extractDataForSecurity(res: Response) {
		if (res.json().data) {
		return res.json();
		} else {
		return Observable.throw(res.json());
		}
		};

	private handleError(error: Response | any) {
		console.log("http error", error);
		// In a real world app, you might use a remote logging infrastructure
		return Observable.throw(error);
	};
};



