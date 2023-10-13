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
import { ConfigService } from '../config/config.service';
import { InterceptedHttp } from './../../http.interceptor';
import { SecurityInterceptedHttp } from '../../http.securityinterceptor';

@Injectable()
export class ItemFormService {
    admin_Base_Url: any;
    common_Base_Url: any;
    get_itemform_Url: any;
     save_itemform_Url: any;
     update_itemform_Url:any;
     delete_itemform_Url:any;

    constructor(private http: SecurityInterceptedHttp, public basepaths: ConfigService, private httpIntercept: InterceptedHttp) {
        this.admin_Base_Url = this.basepaths.getAdminBaseUrl();
        this.common_Base_Url = this.basepaths.getCommonBaseURL();
        this.get_itemform_Url = this.admin_Base_Url + 'getItemForm';
         this.save_itemform_Url=this.admin_Base_Url + 'createItemForms';
         this.update_itemform_Url=this.admin_Base_Url + 'editItemForm';
         this.delete_itemform_Url=this.admin_Base_Url + 'blockItemForm';
    };

    getAllItemForm(providerServiceMapID) {
        return this.http.get(this.get_itemform_Url + '/' + providerServiceMapID 
        ).map(this.handleSuccess)
            .catch(this.handleError);
    }
    
    saveItemForm(obj) {
        return this.http.post(this.save_itemform_Url, obj
        ).map(this.handleSuccess)
            .catch(this.handleError);
    }
    updateItemForm(obj){
        return this.http.post(this.update_itemform_Url, obj
        ).map(this.handleSuccess)
            .catch(this.handleError);
    }
    deleteItemForm(obj){
        return this.http.post(this.delete_itemform_Url, obj
        ).map(this.handleSuccess)
            .catch(this.handleError);
    }
    handleError(error: Response | any) {
        return Observable.throw(error.json());
    }
    handleSuccess(res: Response) {
        console.log(res.json().data, 'ItemForm file success response');
        if (res.json().data) {
            return res.json().data;
        } else {
            return Observable.throw(res.json());
        }
    }
}