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
import { Component, OnInit } from '@angular/core';
import { loginService } from '../services/loginService/login.service';
import { dataService } from '../services/dataService/data.service';
import { Router } from '@angular/router';
import { ConfirmationDialogsService } from './../services/dialog/confirmation.service';
import { HttpServices } from "../services/http-services/http_services.service";
import { Subscription } from 'rxjs/Subscription';
import { InterceptedHttp } from 'app/http.interceptor';
import * as CryptoJS from 'crypto-js';
import * as bcrypt from 'bcryptjs';

@Component({
  selector: 'login-component',
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})

export class loginContentClass implements OnInit {
  model: any = {};
  userID: any;
  password: any;
  serviceProviderID: any;
  status: any;
  dynamictype: any = 'password';
  public loginResult: string;
  commitDetailsPath: any = "assets/git-version.json";
  version: any;
  commitDetails: any;
  key: any;
  iv: any;
  SALT: string = "RandomInitVector";
  Key_IV: string = "Piramal12Piramal";
  encPassword: string;
  _keySize: any;
  _ivSize: any;
  _iterationCount: any;
  logoutUserFromPreviousSessionSubscription: Subscription;
  encryptPassword: any;

  constructor(public loginservice: loginService,
    public router: Router,
    private alertMessage: ConfirmationDialogsService,
    public dataSettingService: dataService,
    public HttpServices: HttpServices,
    private httpService: InterceptedHttp) {
      this._keySize = 256;
      this._ivSize = 128;
      this._iterationCount = 1989;
     };

  ngOnInit() {
    this.httpService.dologoutUsrFromPreSession(false);
    this.logoutUserFromPreviousSessionSubscription = this.httpService.logoutUserFromPreviousSessions$.subscribe((logoutUser) => {
      if(logoutUser) {
        this.loginUser(true);
      }
    })
    if (sessionStorage.getItem('authToken')) {
      this.loginservice.checkAuthorisedUser().subscribe((response) => this.gotLoginRes(response),
        (err) => console.log('Getting login response through auth token failed' + err));
    }
    this.getCommitDetails();
  }
  gotLoginRes(res: any) {
    if (res.userName == 'Super  Admin') {
      this.dataSettingService.Userdata = { 'userName': 'Super Admin' };
      this.dataSettingService.role = 'SUPERADMIN';
      this.dataSettingService.uname = 'Super Admin';
      this.router.navigate(['/MultiRoleScreenComponent']);
    } else {
      this.successCallback(res);
    }
  }

  get keySize() {
    return this._keySize;
  }

  set keySize(value) {
    this._keySize = value;
  }



  get iterationCount() {
    return this._iterationCount;
  }



  set iterationCount(value) {
    this._iterationCount = value;
  }



  generateKey(salt, passPhrase) {
    return CryptoJS.PBKDF2(passPhrase, CryptoJS.enc.Hex.parse(salt), {
    hasher: CryptoJS.algo.SHA512,
      keySize: this.keySize / 32,
      iterations: this._iterationCount
    })
  }



  encryptWithIvSalt(salt, iv, passPhrase, plainText) {
    let key = this.generateKey(salt, passPhrase);
    let encrypted = CryptoJS.AES.encrypt(plainText, key, {
      iv: CryptoJS.enc.Hex.parse(iv)
    });
    return encrypted.ciphertext.toString(CryptoJS.enc.Base64);
  }

  encrypt(passPhrase, plainText) {
    let iv = CryptoJS.lib.WordArray.random(this._ivSize / 8).toString(CryptoJS.enc.Hex);
    let salt = CryptoJS.lib.WordArray.random(this.keySize / 8).toString(CryptoJS.enc.Hex);
    let ciphertext = this.encryptWithIvSalt(salt, iv, passPhrase, plainText);
    return salt + iv + ciphertext;
  }

  login(userId: any, password: any, doLogout) {
    bcrypt.hash(this.password, 12, (err, hashedPassword) => {
      if (err) {
        console.error('Error hashing password:', err);
      } else {
        this.encryptPassword = hashedPassword;
          if (userId.toLowerCase() === 'SUPERADMIN'.toLowerCase()) {
      
      
            this.loginservice.superAdminAuthenticate(userId, this.encryptPassword, doLogout)
            .subscribe(response => {
              if (response.isAuthenticated) {
                if (response.previlegeObj.length === 0) {
                console.log(response, 'SUPERADMIN VALIDATED');
                sessionStorage.setItem('authToken', response.key);
                this.dataSettingService.Userdata = { 'userName': 'Super Admin' };
                this.dataSettingService.role = 'SUPERADMIN';
                this.dataSettingService.uname = 'Super Admin';
                this.dataSettingService.uid = response.userID;
                this.router.navigate(['/MultiRoleScreenComponent']);
                } else {
                this.alertMessage.alert('User is not super admin');
            }

          }

        }, err => {
          this.alertMessage.alert(err, 'error')
          console.log(err, 'ERR while superadmin validation');
        });

    } else {
      this.loginservice.authenticateUser(userId, this.encryptPassword, doLogout).subscribe(
        (response: any) => {
          sessionStorage.setItem('authToken', response.key);
          this.successCallback(response);
        },
        (error: any) => 
          this.errorCallback(error)
          );
        }
      }
    });
  };

  loginUser(doLogOut) {
    this.loginservice
    .userLogOutFromPreviousSession(this.userID)
    .subscribe(
      (userLogOutRes: any) => {
      if(userLogOutRes && userLogOutRes.response) {
         bcrypt.hash(this.password, 12, (err, hashedPassword) => {
            if (err) {
              console.error('Error hashing password:', err);
            } else {
              this.encryptPassword = hashedPassword;
              if (this.userID.toLowerCase() === 'SUPERADMIN'.toLowerCase()){
                this.loginservice.superAdminAuthenticate(this.userID, this.encryptPassword, doLogOut)
                  .subscribe(response => {
                if (response.isAuthenticated) {
                  if (response.previlegeObj.length === 0) {
                    console.log(response, 'SUPERADMIN VALIDATED');
                    sessionStorage.setItem('authToken', response.key);
                    this.dataSettingService.Userdata = { 'userName': 'Super Admin' };
                    this.dataSettingService.role = 'SUPERADMIN';
                    this.dataSettingService.uname = 'Super Admin';
                    this.dataSettingService.uid = response.userID;
                    this.router.navigate(['/MultiRoleScreenComponent']);
                  } else {
                this.alertMessage.alert('User is not super admin');
              }
  
            }
  
          }, err => {
            this.alertMessage.alert(err, 'error')
            console.log(err, 'ERR while superadmin validation');
          });  
        }
        else {

        this.loginservice.authenticateUser(this.userID, this.encryptPassword, doLogOut).subscribe(
          (response: any) => {
            sessionStorage.setItem('authToken', response.key);
            this.successCallback(response);
          },
          (error: any) => {
            this.errorCallback(error)
          });
        }
      }
    });
  }
      else
      {
            this.alertMessage.alert(userLogOutRes.errorMessage, 'error');
      }
      });
  }

  successCallback(response: any) {
    console.log(response);
    this.dataSettingService.Userdata = response;
    this.dataSettingService.userPriveliges = response.previlegeObj;
    this.dataSettingService.uid = response.userID;
    this.dataSettingService.uname = response.userName;
    console.log('array', response.previlegeObj);

    if (response.isAuthenticated === true && response.Status === 'Active') {
      console.log('response.previlegeObj[0].serviceID', response.previlegeObj[0].serviceID);
      this.loginservice.getServiceProviderID(response.previlegeObj[0].serviceID)
        .subscribe(res => this.getServiceProviderMapIDSuccessHandeler(res),
          (err) => console.log('error in fetching service provider ID', err));
      for (let i = 0; i < response.Previlege.length; i++) {

        if (response.Previlege[i].Role === 'ProviderAdmin') {
         
          this.dataSettingService.role = 'PROVIDERADMIN';
          console.log('VALUE SET HOGAYI');
        } else {
          this.dataSettingService.role = '';
        }
        
      }
      if (this.dataSettingService.role.toLowerCase() === 'PROVIDERADMIN'.toLowerCase()) {
        this.router.navigate(['/MultiRoleScreenComponent']);
      } else {
        this.alertMessage.alert('User is not a provider admin');
      }

    }
    if (response.isAuthenticated === true && response.Status === 'New') {
      this.status = 'new';
      sessionStorage.setItem('authToken', response.key);
      this.router.navigate(['/setQuestions']);
    }

    for (let i = 0; i < response.previlegeObj.length; i++) {
      if (response.previlegeObj[i].serviceDesc.toLowerCase() === '104 helpline') {
        this.dataSettingService.providerServiceMapID_104 = response.previlegeObj[i].providerServiceMapID;
      }
    }
  };
  errorCallback(error: any) {
    if (error.status) {
      this.loginResult = error.errorMessage;
    } else {
      this.loginResult = 'Internal issue please try after some time';
    }
   
    console.log(error);
  };

  

  showPWD() {
    this.dynamictype = 'text';
  }

  hidePWD() {
    this.dynamictype = 'password';
  }


  getServiceProviderMapIDSuccessHandeler(response) {
    console.log('service provider map id', response);
    if (response != undefined) {
      this.dataSettingService.service_providerID = response.serviceProviderID;
      this.serviceProviderID = response.serviceProviderID;
    } else {
      this.alertMessage.alert('Service Provider map ID is not fetched', 'error');
    }
  }

  getCommitDetails() {
    let Data = this.commitDetailsPath;
    this.HttpServices.getCommitDetails(this.commitDetailsPath).subscribe((res) => this.successhandeler1(res), err => this.successhandeler1(err));
  }
  successhandeler1(response) {
    this.commitDetails = response;
    this.version = this.commitDetails['version']
  }

  ngOnDestroy() {
    if (this.logoutUserFromPreviousSessionSubscription) {
      this.logoutUserFromPreviousSessionSubscription.unsubscribe();
    }
  }
}
