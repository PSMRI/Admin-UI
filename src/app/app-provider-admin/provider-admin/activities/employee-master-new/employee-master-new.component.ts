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
import {
  Component,
  OnInit,
  ViewChild,
  Inject,
  ChangeDetectorRef,
  ViewRef,
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { finalize } from 'rxjs/operators';
import { EmployeeMasterNewServices } from 'src/app/app-provider-admin/provider-admin/activities/services/employee-master-new-services.service';
import { dataService } from 'src/app/core/services/dataService/data.service';
import { ConfirmationDialogsService } from 'src/app/core/services/dialog/confirmation.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-employee-master-new',
  templateUrl: './employee-master-new.component.html',
  styleUrls: ['./employee-master-new.component.css'],
})
export class EmployeeMasterNewComponent implements OnInit {
  // filteredsearchResult: any = [];
  // dataSource = new MatTableDataSource<any>();
  objs = new MatTableDataSource<any>();
  userId: any;
  createdBy: any;
  serviceProviderID: any;
  disabled = true;
  displayedColumns: string[] = [
    'activePage',
    'Title',
    'Username',
    'EmergencyContact',
    'EmailID',
    'DOJ',
    'Designation',
    'LockStatus',
    'LockAction',
    'edit',
    'action',
  ];
  displayedColumnsTable2: string[] = [
    'SNo',
    'UserName',
    'EmailID',
    'EmergencyContact',
    'action',
  ];
  paginator!: MatPaginator;
  sort!: MatSort;
  @ViewChild(MatPaginator) set matPaginator(mp: MatPaginator) {
    this.paginator = mp;
    this.setDataSourceAttributes();
  }
  @ViewChild(MatSort) set matSort(ms: MatSort) {
    this.sort = ms;
    this.setDataSourceAttributes();
  }
  filteredsearchResult = new MatTableDataSource<any>();
  isLoading = false;

  setDataSourceAttributes() {
    if (this.filteredsearchResult && this.paginator) {
      this.filteredsearchResult.paginator = this.paginator;
    }
    if (this.filteredsearchResult && this.sort) {
      this.filteredsearchResult.sort = this.sort;
    }
    // this.objs.paginator = this.paginator;
  }
  //ngModel
  titleID: any;
  firstname: any;
  middlename: any;
  lastname: any;
  genderID: any;
  contactNo: any;
  designationID: any;
  emergency_contactNo: any;
  dob: any;
  today = new Date();
  mindate: any;
  maxdate: any;
  age: any;
  emailID: any;
  maritalStatusID: any;
  aadharNumber: any;
  panNumber: any;
  qualificationID: any;
  healthProfessionalID: any;
  username: any;
  employee_ID: any;
  user_password: any;
  doj: any;
  minDate_doj: any;
  community: any;
  religion: any;
  username_status!: string;
  empID_status!: string;
  showHint!: boolean;
  empIdshowHint!: boolean;
  username_dependent_flag!: boolean;
  isExistAadhar = false;
  isExistPan = false;
  isHPIdExist = false;
  errorMessageForAadhar!: string;
  errorMessageForPan!: string;
  errorMessageForHPID!: any;
  id: any;
  confirmMessage: any;
  panelOpenState = true;
  userType = false;
  manipulateEMpIDAndDOJ = false;
  setDoj: any;
  patchDojOnEdit: any;
  isExternal: any;
  enablehealthProfessionalID = false;
  errorValidationMsgForHPId = false;

  //Demographics ngModel
  fatherName: any;
  motherName: any;
  currentAddressLine1: any;
  currentAddressLine2: any;
  countryId: any = 1;
  currentState: any;
  currentDistrict: any;
  currentPincode: any;
  permanentAddressLine1: any;
  permanentAddressLine2: any;
  permanentState: any;
  permanentDistrict: any;
  permanentPincode: any;
  isPresent: any;
  isPermanent: any;
  checkAddress = false;
  dynamictype: any = 'password';

  //array
  searchResult: any = [];
  titles: any = [];
  genders: any = [];
  designations: any = [];
  maritalStatuses: any = [];
  eduQualifications: any = [];
  states: any = [];
  currentDistricts: any = [];
  permanentDistricts: any = [];
  communities: any = [];
  religions: any = [];

  downloadMemberExcelFile: any;

  // objs: any = [];
  searchTerm: any;
  selfHealthProfessionalID: any;
  selfAadharNo: any;
  selfPanNo: any;

  //flags
  tableMode = true;
  formMode = false;
  editMode = false;

  //constants & variables
  emailPattern = /^[0-9a-zA-Z_.]+@[a-zA-Z_]+?\.\b(org|com|COM|IN|in|co.in)\b$/;
  // userNamePattern = /^[0-9a-zA-Z]+[0-9a-zA-Z-_.]+[0-9a-zA-Z]$/;
  passwordPattern =
    /^(?=.*[0-9])(?=.*[A-Z])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,12}$/;
  mobileNoPattern = /^[1-9][0-9]{9}/;
  healthIDPattern = /^[a-zA-Z][a-zA-Z0-9.]+$/;

  @ViewChild('userCreationForm')
  userCreationForm!: NgForm;
  @ViewChild('demographicsDetailsForm')
  demographicsDetailsForm!: NgForm;
  @ViewChild('communicationDetailsForm')
  communicationDetailsForm!: NgForm;
  disableGenerateOTP: any;
  employeeMasterUpload = false;

  // md2.data: Observable<Array<item>>;

  constructor(
    public employeeMasterNewService: EmployeeMasterNewServices,
    public dataServiceValue: dataService,
    public dialogService: ConfirmationDialogsService,
    public dialog: MatDialog,
    readonly sessionstorage: SessionStorageService,
    private cdr: ChangeDetectorRef,
  ) {
    this.filteredsearchResult.data = [];
  }

  ngOnInit() {
    this.createdBy = this.dataServiceValue.uname;
    console.log('createdBY', this.createdBy);

    this.serviceProviderID = this.sessionstorage.getItem('service_providerID');
    this.getAllUserDetails();
    this.minDate_doj = new Date();
  }

  /*
   * All details of the user
   */
  getAllUserDetails() {
    console.log('serviceProvider', this.serviceProviderID);

    this.isLoading = true;
    this.employeeMasterNewService
      .getAllUsers(this.serviceProviderID)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          if (!(this.cdr as ViewRef).destroyed) {
            this.cdr.detectChanges();
          }
        }),
      )
      .subscribe(
        (response: any) => {
          const employeeList = this.extractEmployeeList(response);
          console.log('All details of the user', employeeList);
          console.log('list length', employeeList?.length);
          this.searchResult = employeeList;
          this.refreshFilteredData(employeeList);
        },
        (err) => {
          console.log('error', err);
          this.refreshFilteredData([]);
        },
      );
  }

  private extractEmployeeList(response: any): any[] {
    let rawData = response;

    if (rawData && typeof rawData === 'object' && 'data' in rawData) {
      rawData = rawData.data;
    }

    rawData = this.deepParseIfString(rawData);

    if (Array.isArray(rawData)) {
      return rawData;
    }

    if (rawData && typeof rawData === 'object') {
      if (Array.isArray(rawData.data)) {
        return rawData.data;
      }
      if (Array.isArray(rawData.response)) {
        return rawData.response;
      }
      if (Array.isArray(rawData.result)) {
        return rawData.result;
      }
      const firstArray = Object.values(rawData).find((value) =>
        Array.isArray(value),
      );
      if (Array.isArray(firstArray)) {
        return firstArray;
      }
    }

    return [];
  }

  private deepParseIfString(candidate: any): any {
    let parsedValue = candidate;
    const seen = new Set<any>();

    while (typeof parsedValue === 'string') {
      const trimmed = parsedValue.trim();
      if (!trimmed) {
        return [];
      }
      if (seen.has(trimmed)) {
        break;
      }
      seen.add(trimmed);
      try {
        parsedValue = JSON.parse(trimmed);
      } catch (error) {
        console.error('Failed to parse employee master response string', error);
        return [];
      }
    }

    return parsedValue;
  }
  showForm() {
    this.tableMode = false;
    this.formMode = true;
    this.editMode = false;
    this.userType = false;
    this.resetDob();

    this.employeeMasterNewService.getCommonRegistrationData().subscribe(
      (res) => this.showGenderOnCondition(res.data),
      (err) => console.log('error', err),
    );

    this.employeeMasterNewService.getAllDesignations().subscribe(
      (res) => this.getAllDesignationsSuccessHandler(res.data),
      (err) => console.log('error', err),
    );

    this.employeeMasterNewService.getAllMaritalStatuses().subscribe(
      (res) => this.getAllMaritalStatusesSuccessHandler(res.data),
      (err) => console.log('error', err),
    );

    this.employeeMasterNewService.getAllQualifications().subscribe(
      (res) => this.getAllQualificationsSuccessHandler(res.data),
      (err) => console.log('error', err),
    );

    this.employeeMasterNewService.getAllCommunities().subscribe(
      (res) => this.getCommunitiesSuccessHandler(res.data),
      (err) => console.log('error', err),
    );

    this.employeeMasterNewService.getAllReligions().subscribe(
      (res) => this.getReligionSuccessHandler(res.data),
      (err) => console.log('error', err),
    );

    this.employeeMasterNewService.getAllStates(this.countryId).subscribe(
      (res) => this.getAllStatesSuccessHandler(res.data),
      (err) => console.log('error', err),
    );
  }
  /*
   * Reset the dob on adding multiple objects
   */
  resetDob() {
    this.dob = new Date();
    this.dob.setHours(0);
    this.dob.setMinutes(0);
    this.dob.setSeconds(0);
    this.dob.setMilliseconds(0);
    // setting dob as min 14 years to restrict child labour
    this.dob.setFullYear(this.today.getFullYear() - 14);
    this.maxdate = new Date();
    this.maxdate.setFullYear(this.today.getFullYear() - 14);
    this.mindate = new Date();
    this.mindate.setFullYear(this.today.getFullYear() - 70);
    this.calculateAge(this.dob);
  }
  resetDoj() {
    this.doj = null;
    this.calculateDoj(this.dob);
  }
  /*
   * display the added user's in the table
   */
  showTable() {
    this.resetAllForms();
    this.tableMode = true;
    this.formMode = false;
    this.editMode = false;
  }

  back() {
    this.dialogService
      .confirm(
        'confirm',
        'Do you really want to cancel? Any unsaved data would be lost',
      )
      .subscribe((res) => {
        if (res) {
          this.objs.data = [];
          this.searchTerm = null;
          this.refreshFilteredData(this.searchResult);
          this.showTable();
          this.resetAllFlags();
        }
      });
  }
  // encryptionFlag: boolean = true;
  resetAllFlags() {
    this.enablehealthProfessionalID = false;
    this.errorValidationMsgForHPId = false;
    this.isHPIdExist = false;
    this.isExistPan = false;
    this.isExistAadhar = false;
    this.empIdshowHint = false;
    this.username_dependent_flag = false;
    this.showHint = false;
  }
  showPWD() {
    this.dynamictype = 'text';
  }

  hidePWD() {
    this.dynamictype = 'password';
  }

  /*
   * calculate the doj based on dob
   */
  calculateDoj(dob: any) {
    //calculate doj as dob + 14 years & this is rest if dob is changed
    this.today = new Date();
    this.minDate_doj.setFullYear(
      dob.getFullYear() + 14,
      dob.getMonth(),
      dob.getDate(),
    );
    console.log('set minDate_doj', this.minDate_doj);
    this.minDate_doj = new Date(this.minDate_doj);
    console.log(' b4 minDate_doj', this.minDate_doj);
  }
  /*
   * Display gender on condition
   */

  setGenderOnCondition() {
    if (
      this.titleID === 2 ||
      this.titleID === 4 ||
      this.titleID === 5 ||
      this.titleID === 13
    ) {
      this.genderID = 2;
    } else if (this.titleID === 3 || this.titleID === 8) {
      this.genderID = 1;
    } else {
      this.genderID = '';
    }
  }
  showGenderOnCondition(response: any) {
    console.log('Display gender on condition', response);
    this.titles = response.m_Title;
    this.genders = response.m_genders;
  }
  /*
   * User name availability
   */

  checkUserNameAvailability(username: any) {
    this.employeeMasterNewService.checkUserAvailability(username).subscribe(
      (response) => this.checkUsernameSuccessHandeler(response.data),
      (err) => console.log('error', err),
    );
  }

  checkUsernameSuccessHandeler(response: any) {
    console.log('username existance status', response);
    if (response.response === 'userexist') {
      this.username_status = 'User ID exists';
      this.showHint = true;
      this.username_dependent_flag = true;
      // this.username = null;
    }
    if (response.response === 'usernotexist') {
      if (
        this.username !== '' &&
        this.username !== undefined &&
        this.username !== null
      ) {
        console.log('if response', response);
        this.showHint = false;
        this.username_dependent_flag = false;
      }
      // else
      // {
      //   console.log("else response", response);
      //   this.showHint = true;
      //   this.username_dependent_flag = true;
      //   this.username_status = 'Username is required';
      // }
    }
  }
  checkEmployeeIdAvailability(empID: any) {
    this.employeeMasterNewService.checkEmpIdAvailability(empID).subscribe(
      (response) => this.checkempIdSuccessHandeler(response.data),
      (err) => console.log('error', err),
    );
  }

  checkempIdSuccessHandeler(response: any) {
    console.log('employee ID existance status', response);
    if (response.response === 'true') {
      this.empID_status = 'Employee ID exists';
      this.empIdshowHint = true;
    }
    if (response.response === 'false') {
      if (
        this.employee_ID !== '' &&
        this.employee_ID !== undefined &&
        this.employee_ID !== null
      ) {
        this.empIdshowHint = false;
      }
    }
  }
  // to check the validations for health professional ID feild
  isLetter(value: any) {
    return value.length === 1 && value.match(/[a-z]/i);
  }
  is_numeric(value: any) {
    return /^\d+$/.test(value);
  }
  validateHealthProfessionalId() {
    const healthProfessinalIdValue = this.healthProfessionalID;
    let count = 0;
    let countFlag = false;
    if (
      healthProfessinalIdValue !== '' &&
      healthProfessinalIdValue !== undefined &&
      healthProfessinalIdValue !== null
    ) {
      const hprId = healthProfessinalIdValue;
      if (hprId.charAt(hprId.length - 1) === '.') {
        this.errorMessageForHPID = null;
        this.errorValidationMsgForHPId = true;
      } else {
        for (let i = 0; i < hprId.length; i++) {
          if (!this.is_numeric(hprId.charAt(i))) {
            if (!this.isLetter(hprId.charAt(i))) {
              if (hprId.charAt(i) === '.') count++;
              else {
                countFlag = true;
                break;
              }
            }
          }
        }
        if (count > 1 || countFlag) {
          this.errorMessageForHPID = null;
          this.errorValidationMsgForHPId = true;
        } else {
          this.errorValidationMsgForHPId = false;
        }
      }
    } else {
      this.errorValidationMsgForHPId = false;
    }
  }
  preventTyping(e: any) {
    if (e.keyCode === 9) {
      return true;
    } else {
      return false;
    }
  }
  /*
   * calculate age based on the DOB
   */
  calculateAge(date: any) {
    this.disabled = false;
    if (date !== undefined) {
      let age = this.today.getFullYear() - date.getFullYear();
      if (this.objs.data.length === 0) {
        this.age = age;
        this.userCreationForm.form.patchValue({ user_age: age });
      } else {
        this.userCreationForm.form.patchValue({ user_age: age });
      }

      const month = this.today.getMonth() - date.getMonth();
      if (month < 0 || (month === 0 && this.today.getDate() < date.getDate())) {
        age--; //age is ng-model of AGE
        if (this.objs.data.length === 0) {
          this.age = age;
          this.userCreationForm.form.patchValue({ user_age: age });
        } else {
          this.userCreationForm.form.patchValue({ user_age: age });
        }
      }
    }

    this.disabled = true;
  }
  /*
   * Get all Designations
   */
  getAllDesignationsSuccessHandler(response: any) {
    console.log('Display All Designations', response);
    this.designations = response;
  }
  /*
   * Get all marital statuses
   */
  getAllMaritalStatusesSuccessHandler(response: any) {
    console.log('Display all marital status', response);
    this.maritalStatuses = response;
  }
  /*
   * Get all educational qualifications
   */
  getAllQualificationsSuccessHandler(response: any) {
    console.log('Display all Qualifications', response);
    this.eduQualifications = response;
  }
  /*
   * Check Uniqueness in Aadhar
   */
  checkAadhar() {
    // this.isExistAadhar = false;
    // this.errorMessageForAadhar = '';
    //to check the duplicates in buffertable
    if (
      this.editMode !== true &&
      this.aadharNumber !== undefined &&
      this.aadharNumber !== null
    ) {
      this.validateAadharNo();
    }

    if (
      this.editMode === true &&
      this.aadharNumber !== undefined &&
      this.aadharNumber !== null &&
      this.selfAadharNo !== undefined &&
      this.selfAadharNo !== null &&
      this.selfAadharNo !== this.aadharNumber
    ) {
      this.validateAadharNo();
    } else if (
      this.editMode === true &&
      this.aadharNumber !== undefined &&
      this.aadharNumber !== null &&
      (this.selfAadharNo === undefined || this.selfAadharNo === null)
    ) {
      this.validateAadharNo();
    } else {
      this.isExistAadhar = false;
      this.errorMessageForAadhar = '';
    }
  }
  validateAadharNo() {
    console.log('aadharNumber', this.aadharNumber);
    if (this.aadharNumber.length === 12) {
      this.employeeMasterNewService.validateAadhar(this.aadharNumber).subscribe(
        (response: any) => {
          if (response) {
            this.checkAadharSuccessHandler(response.data);
          } else {
            this.dialogService.alert(response.error.errorMessage, 'error');
            this.aadharNumber = null;
          }
        },
        (err) => {
          console.log('error', err);
          this.dialogService.alert(err, 'error');
          this.aadharNumber = null;
        },
      );
    }
  }
  checkAadharSuccessHandler(response: any) {
    if (response.response === 'true') {
      this.isExistAadhar = true;
      this.errorMessageForAadhar = 'Aadhar Number Already Exists';
    } else {
      this.isExistAadhar = false;
      this.errorMessageForAadhar = '';
    }
  }
  /*
   * Check Uniqueness in Pan
   */
  checkPan() {
    //this.isExistPan = false;
    //this.errorMessageForPan = '';
    if (
      this.editMode !== true &&
      this.panNumber !== undefined &&
      this.panNumber !== null
    ) {
      this.validatePanNo();
    }
    if (
      this.editMode === true &&
      this.panNumber !== undefined &&
      this.panNumber !== null &&
      this.selfPanNo !== undefined &&
      this.selfPanNo !== null &&
      this.selfPanNo.toLowerCase() !== this.panNumber.toLowerCase()
    ) {
      this.validatePanNo();
    } else if (
      this.editMode === true &&
      this.panNumber !== undefined &&
      this.panNumber !== null &&
      (this.selfPanNo === undefined || this.selfPanNo === null)
    ) {
      this.validatePanNo();
    } else {
      this.isExistPan = false;
      this.errorMessageForPan = '';
    }
  }
  validatePanNo() {
    if (this.panNumber.length === 10) {
      this.employeeMasterNewService.validatePan(this.panNumber).subscribe(
        (response) => {
          if (response) {
            console.log('pan response', response.data);
            this.checkPanSuccessHandler(response.data);
          } else {
            this.dialogService.alert(response, 'error');
            this.panNumber = null;
          }
        },
        (err) => {
          console.log('error', err);
          this.dialogService.alert(err, 'error');
          this.panNumber = null;
        },
      );
    }
  }
  checkPanSuccessHandler(response: any) {
    if (response.response === 'true') {
      this.isExistPan = true;
      this.errorMessageForPan = 'Pan Number Already Exists';
    } else {
      this.isExistPan = false;
      this.errorMessageForPan = '';
    }
  }
  omit_special_char(event: any) {
    const k = event.charCode; // Use const instead of let
    return (
      (k > 64 && k < 91) ||
      (k > 96 && k < 123) ||
      k === 8 ||
      k === 32 ||
      (k >= 48 && k <= 57)
    );
  }

  // to check existance of health professional ID
  checkHealthProfessionalID() {
    //this.isHPIdExist = false;
    //this.errorMessageForHPID = '';
    if (
      this.editMode !== true &&
      this.healthProfessionalID !== undefined &&
      this.healthProfessionalID !== null
    ) {
      this.validateHealthProfessionalID();
    }

    if (
      this.editMode === true &&
      this.healthProfessionalID !== undefined &&
      this.healthProfessionalID !== null &&
      this.selfHealthProfessionalID !== undefined &&
      this.selfHealthProfessionalID !== null &&
      this.selfHealthProfessionalID.toLowerCase() !==
        this.healthProfessionalID.toLowerCase()
    ) {
      this.validateHealthProfessionalID();
    } else if (
      this.editMode === true &&
      this.healthProfessionalID !== undefined &&
      this.healthProfessionalID !== null &&
      (this.selfHealthProfessionalID === undefined ||
        this.selfHealthProfessionalID === null)
    ) {
      this.validateHealthProfessionalID();
    } else {
      this.isHPIdExist = false;
      this.errorMessageForHPID = '';
    }
  }
  validateHealthProfessionalID() {
    if (this.healthProfessionalID.length >= 4) {
      const reqObject = this.healthProfessionalID + '@hpr.sbx';
      this.employeeMasterNewService
        .validateHealthProfessionalID(reqObject)
        .subscribe(
          (response) => {
            if (response) {
              console.log('HPID response', response.data);
              this.checkHealthProfessionalIDSuccessHandler(response.data);
            } else {
              this.dialogService.alert(response, 'error');
              this.healthProfessionalID = null;
            }
          },
          (err) => {
            console.log('error', err);
            this.dialogService.alert(err, 'error');
            this.healthProfessionalID = null;
          },
        );
    }
  }
  checkHealthProfessionalIDSuccessHandler(response: any) {
    if (response === 'true') {
      this.isHPIdExist = true;
      this.errorMessageForHPID = 'Health Professional ID Already Exists';
    } else {
      this.isHPIdExist = false;
      this.errorMessageForHPID = '';
    }
  }
  /*
   * Get all communities
   */
  getCommunitiesSuccessHandler(response: any) {
    console.log('Display all Communities', response);
    this.communities = response;
  }
  /*
   * Get all religion
   */
  getReligionSuccessHandler(response: any) {
    console.log('Display all religions', response);
    this.religions = response;
  }

  /*
   * Get all States
   */
  getAllStatesSuccessHandler(response: any) {
    console.log('Display all States', response);
    this.states = response;
  }
  /*
   * Get all Districts for current address
   */
  getCurrentDistricts(currentStateID: any) {
    this.checkAddress = false;
    this.employeeMasterNewService.getAllDistricts(currentStateID).subscribe(
      (response) => {
        this.getCurrentDistrictsSuccessHandler(response.data);
      },
      (err) => console.log('error', err),
    );
  }
  getCurrentDistrictsSuccessHandler(response: any) {
    console.log('Display all Districts', response);
    this.currentDistricts = response;
  }
  resetcheckBox() {
    this.checkAddress = false;
  }
  /*
   * Get all Districts for permanent address
   */
  getPermanentDistricts(permanentStateID: any) {
    this.employeeMasterNewService.getAllDistricts(permanentStateID).subscribe(
      (response) => {
        this.getPermanentDistrictsSuccessHandler(response.data);
      },
      (err) => console.log('error', err),
    );
  }
  getPermanentDistrictsSuccessHandler(response: any) {
    console.log('Display all Districts', response);
    this.permanentDistricts = response;
  }

  disable_permanentAddress_flag = false;

  addressCheck(value: any) {
    if (value.checked) {
      this.permanentAddressLine1 = this.currentAddressLine1;
      this.permanentAddressLine2 = this.currentAddressLine2;
      this.permanentState = this.currentState;
      this.permanentDistrict = this.currentDistrict;
      this.getPermanentDistricts(this.currentState);
      this.permanentPincode = this.currentPincode;
      this.isPermanent = '1';
      this.isPresent = '0';
      this.disable_permanentAddress_flag = true;
    } else {
      this.permanentAddressLine1 = '';
      this.permanentAddressLine2 = '';
      this.permanentState = '';
      this.permanentDistrict = '';
      this.permanentPincode = '';
      this.isPermanent = '0';
      this.isPresent = '1';
      this.disable_permanentAddress_flag = false;
      this.checkAddress = false;
    }
  }

  /*
   * Reset all the forms
   */
  resetAllForms() {
    this.userCreationForm.resetForm();
    this.demographicsDetailsForm.resetForm();
    this.communicationDetailsForm.resetForm();
    this.resetDob();
    this.resetDoj();
    this.manipulateEMpIDAndDOJ = false;
    this.userCreationForm.form.patchValue({
      userType: false,
    });
  }
  changeUserType(flag: any) {
    this.manipulateEMpIDAndDOJ = flag;
    this.employee_ID = null;
    this.doj = null;
  }
  /*
   * Method for addition of objects
   */
  add_object(
    userFormValue: any,
    demographicsFormValue: any,
    communicationFormValue: any,
  ) {
    const tempObj = {
      titleID: userFormValue.title_Id,
      firstname: userFormValue.user_firstname,
      middlename: userFormValue.user_middlename,
      lastname: userFormValue.user_lastname,
      genderID: userFormValue.gender_Id,
      dob: userFormValue.user_dob,
      // 'age': userFormValue.user_age,
      age: this.age,
      contactNo: userFormValue.primaryMobileNo,
      emailID: userFormValue.primaryEmail,
      designationID: userFormValue.designation,
      maritalStatusID: userFormValue.marital_status,
      aadharNumber: userFormValue.aadhar_number,
      panNumber: userFormValue.pan_number,
      qualificationID: userFormValue.edu_qualification,
      healthProfessionalID: userFormValue.healthProfessionalID,
      emergency_contactNo: userFormValue.emergencyContactNo,
      username: userFormValue.user_name,
      employeeID: userFormValue.employeeID,
      password: userFormValue.password,
      doj: userFormValue.doj,
      // 'fatherName': demographicsFormValue.father_name.trim(),
      // 'motherName': demographicsFormValue.mother_name.trim(),
      fatherName: demographicsFormValue.father_name,
      motherName: demographicsFormValue.mother_name,
      communityID: demographicsFormValue.community_id,
      religionID: demographicsFormValue.religion_id,
      currentAddressLine1:
        communicationFormValue.address.current_addressLine1 !== undefined &&
        communicationFormValue.address.current_addressLine1 !== null
          ? communicationFormValue.address.current_addressLine1.trim()
          : null,
      currentAddressLine2:
        communicationFormValue.address.current_addressLine2 !== undefined &&
        communicationFormValue.address.current_addressLine2 !== null
          ? communicationFormValue.address.current_addressLine2.trim()
          : null,
      currentState: communicationFormValue.address.current_state,
      currentDistrict: communicationFormValue.address.current_district,
      currentPincode: communicationFormValue.address.current_pincode,
      permanentAddressLine1:
        communicationFormValue.permanent_addressLine1 !== undefined &&
        communicationFormValue.permanent_addressLine1 !== null
          ? communicationFormValue.permanent_addressLine1.trim()
          : null,
      permanentAddressLine2:
        communicationFormValue.permanent_addressLine2 !== undefined &&
        communicationFormValue.permanent_addressLine2 !== null
          ? communicationFormValue.permanent_addressLine2.trim()
          : null,
      permanentState: communicationFormValue.permanent_state,
      permanenttDistrict: communicationFormValue.permanent_district,
      permanentPincode: communicationFormValue.permanent_pincode,
      isPresent: this.isPresent,
      isPermanent: this.isPermanent,
      isExternal: userFormValue.userType,
    };
    console.log('add objects', tempObj);
    // this.objs.push(tempObj);
    //this.checkUserNameAvailability(name);
    this.checkDuplicatesInBuffer(tempObj);
    // this.resetAllForms();
  }

  checkDuplicatesInBuffer(tempObj: any) {
    let duplicateAadhar = 0;
    let duplicatePan = 0;
    let duplicateName = 0;
    let duplicateEmployeeID = 0;
    let duplicateHealthProfessionalID = 0;
    if (this.objs.data.length === 0) {
      this.objs.data.push(tempObj);
      this.objs.paginator = this.paginator;
      this.resetAllFlags();
      this.resetAllForms();
    } else {
      for (let i = 0; i < this.objs.data.length; i++) {
        if (
          this.objs.data[i].aadharNumber !== undefined &&
          tempObj.aadharNumber !== undefined &&
          tempObj.aadharNumber !== null &&
          this.objs.data[i].aadharNumber === tempObj.aadharNumber
        ) {
          duplicateAadhar = duplicateAadhar + 1;
          console.log('duplicateAadhar', duplicateAadhar);
        }
        if (
          this.objs.data[i].panNumber !== undefined &&
          tempObj.panNumber !== undefined &&
          tempObj.panNumber !== null &&
          this.objs.data[i].panNumber === tempObj.panNumber
        ) {
          duplicatePan = duplicatePan + 1;
          console.log('duplicatePan', duplicatePan);
        }
        if (
          this.objs.data[i].username !== undefined &&
          this.objs.data[i].username === tempObj.username
        ) {
          duplicateName = duplicateName + 1;
          console.log('this.duplicateName', duplicateName);
        }
        if (
          this.objs.data[i].employeeID !== undefined &&
          this.objs.data[i].employeeID === tempObj.employeeID
        ) {
          duplicateEmployeeID = duplicateEmployeeID + 1;
          console.log('this.duplicateemployeeID', duplicateName);
        }
        if (
          this.objs.data[i].healthProfessionalID !== undefined &&
          tempObj.healthProfessionalID !== undefined &&
          tempObj.healthProfessionalID !== null &&
          this.objs.data[i].healthProfessionalID.toLowerCase() ===
            tempObj.healthProfessionalID.toLowerCase()
        ) {
          duplicateHealthProfessionalID = duplicateHealthProfessionalID + 1;
        }
      }
      if (
        duplicateAadhar === 0 &&
        duplicatePan === 0 &&
        duplicateName === 0 &&
        duplicateEmployeeID === 0 &&
        duplicateHealthProfessionalID === 0
      ) {
        this.objs.data.push(tempObj);
        this.objs.paginator = this.paginator;
        this.resetAllFlags();
        this.resetAllForms();
      } else if (
        duplicateAadhar > 0 &&
        duplicatePan > 0 &&
        duplicateName > 0 &&
        duplicateEmployeeID > 0 &&
        duplicateHealthProfessionalID > 0
      ) {
        this.dialogService.alert(
          'EmployeeID, Username, Aadhar, Pan number and Health Professional ID already exist',
        );
      } else if (
        duplicateAadhar > 0 &&
        duplicateHealthProfessionalID > 0 &&
        duplicateName > 0 &&
        duplicateEmployeeID > 0
      ) {
        this.dialogService.alert(
          'EmployeeID, Username, Aadhar and Health Professional ID  already exist',
        );
      } else if (
        duplicateAadhar > 0 &&
        duplicatePan > 0 &&
        duplicateName > 0 &&
        duplicateEmployeeID > 0
      ) {
        this.dialogService.alert(
          'EmployeeID, Username, Aadhar and Pan number already exist',
        );
      } else if (
        duplicateAadhar > 0 &&
        duplicatePan > 0 &&
        duplicateHealthProfessionalID > 0 &&
        duplicateEmployeeID > 0
      ) {
        this.dialogService.alert(
          'EmployeeID, Health Professional ID, Aadhar and Pan number already exist',
        );
      } else if (
        duplicateHealthProfessionalID > 0 &&
        duplicatePan > 0 &&
        duplicateName > 0 &&
        duplicateEmployeeID > 0
      ) {
        this.dialogService.alert(
          'EmployeeID, Username, Health Professional ID and Pan number already exist',
        );
      } else if (
        duplicateHealthProfessionalID > 0 &&
        duplicatePan > 0 &&
        duplicateName > 0 &&
        duplicateAadhar > 0
      ) {
        this.dialogService.alert(
          'Health Professional ID, Username, Aadhar and Pan number already exist',
        );
      } else if (duplicateAadhar > 0 && duplicatePan > 0 && duplicateName > 0) {
        this.dialogService.alert(
          'Username, Aadhar and Pan number already exist',
        );
      } else if (
        duplicateAadhar > 0 &&
        duplicatePan > 0 &&
        duplicateEmployeeID > 0
      ) {
        this.dialogService.alert(
          'Employee ID, Aadhar and Pan number already exist',
        );
      } else if (
        duplicateAadhar > 0 &&
        duplicateName > 0 &&
        duplicateEmployeeID > 0
      ) {
        this.dialogService.alert(
          'Aadhar number, Employee ID and Username already exist',
        );
      } else if (
        duplicatePan > 0 &&
        duplicateHealthProfessionalID > 0 &&
        duplicateEmployeeID > 0
      ) {
        this.dialogService.alert(
          'Health Professional ID, Employee ID and Pan number already exist',
        );
      } else if (
        duplicateHealthProfessionalID > 0 &&
        duplicateName > 0 &&
        duplicateAadhar > 0
      ) {
        this.dialogService.alert(
          'Health Professional ID, Aadhar number and Username already exist',
        );
      } else if (
        duplicateHealthProfessionalID > 0 &&
        duplicateAadhar > 0 &&
        duplicatePan > 0
      ) {
        this.dialogService.alert(
          'Health Professional ID, Aadhar number and Pan number already exist',
        );
      } else if (
        duplicateAadhar > 0 &&
        duplicateHealthProfessionalID > 0 &&
        duplicateEmployeeID > 0
      ) {
        this.dialogService.alert(
          'Health Professional ID, Aadhar number and Employee ID already exist',
        );
      } else if (
        duplicateName > 0 &&
        duplicateHealthProfessionalID > 0 &&
        duplicatePan > 0
      ) {
        this.dialogService.alert(
          'Health Professional ID, Aadhar number and Username already exist',
        );
      } else if (
        duplicatePan > 0 &&
        duplicateName > 0 &&
        duplicateEmployeeID > 0
      ) {
        this.dialogService.alert(
          'Pan number, Employee ID and Username already exist',
        );
      } else if (
        duplicateHealthProfessionalID > 0 &&
        duplicateName > 0 &&
        duplicateEmployeeID > 0
      ) {
        this.dialogService.alert(
          'Health Professional ID, Employee ID and Username already exist',
        );
      } else if (duplicateAadhar > 0 && duplicatePan > 0) {
        this.dialogService.alert('Aadhar number and Pan number already exist');
      } else if (duplicateAadhar > 0 && duplicateName > 0) {
        this.dialogService.alert('Aadhar number and Username already exist');
      } else if (duplicatePan > 0 && duplicateName > 0) {
        this.dialogService.alert('Pan number and Username already exist');
      } else if (duplicateAadhar > 0 && duplicateEmployeeID > 0) {
        this.dialogService.alert('Aadhar number and Employee ID already exist');
      } else if (duplicatePan > 0 && duplicateEmployeeID > 0) {
        this.dialogService.alert('Pan number and Employee ID already exist');
      } else if (duplicateEmployeeID > 0 && duplicateName > 0) {
        this.dialogService.alert('Employee ID and Username already exist');
      } else if (duplicateHealthProfessionalID > 0 && duplicateName > 0) {
        this.dialogService.alert(
          'Health Professional ID and Username already exist',
        );
      } else if (duplicateEmployeeID > 0 && duplicateHealthProfessionalID > 0) {
        this.dialogService.alert(
          'Employee ID and Health Professional ID already exist',
        );
      } else if (duplicateHealthProfessionalID > 0 && duplicateAadhar > 0) {
        this.dialogService.alert(
          'Health Professional ID and Aadhar number already exist',
        );
      } else if (duplicateHealthProfessionalID > 0 && duplicatePan > 0) {
        this.dialogService.alert(
          'Health Professional ID and Pan number already exist',
        );
      } else if (duplicateAadhar > 0) {
        this.dialogService.alert('Aadhar number already exist');
      } else if (duplicatePan > 0) {
        this.dialogService.alert('Pan number already exist');
      } else if (duplicateEmployeeID > 0) {
        this.dialogService.alert('Employee number already exist');
      } else if (duplicateHealthProfessionalID > 0) {
        this.dialogService.alert('Health Professional ID already exist');
      } else {
        this.dialogService.alert('Already exist');
      }
    }
  }

  /*
   * Removing single object
   */
  remove_obj(index: any) {
    this.objs.data.splice(index, 1);
  }
  /*
   * User creation
   */
  createUser() {
    const reqObject = [];
    for (let i = 0; i < this.objs.data.length; i++) {
      const tempObj: any = {
        titleID: this.objs.data[i].titleID,
        firstName: this.objs.data[i].firstname,
        middleName: this.objs.data[i].middlename,
        lastName: this.objs.data[i].lastname,
        genderID: this.objs.data[i].genderID,
        age: this.objs.data[i].age,
        contactNo: this.objs.data[i].contactNo,
        emailID: this.objs.data[i].emailID,
        designationID: this.objs.data[i].designationID,
        maritalStatusID: this.objs.data[i].maritalStatusID,
        aadhaarNo: this.objs.data[i].aadharNumber,
        pAN: this.objs.data[i].panNumber,
        qualificationID: this.objs.data[i].qualificationID,
        healthProfessionalID: this.objs.data[i].healthProfessionalID
          ? this.objs.data[i].healthProfessionalID + '@hpr.sbx'
          : this.objs.data[i].healthProfessionalID,
        emergencyContactNo: this.objs.data[i].emergency_contactNo,
        userName: this.objs.data[i].username,
        employeeID: this.objs.data[i].employeeID || null,
        password: this.objs.data[i].password,
        fathersName: this.objs.data[i].fatherName,
        mothersName: this.objs.data[i].motherName,
        communityID: this.objs.data[i].communityID,
        religionID: this.objs.data[i].religionID,
        addressLine1: this.objs.data[i].currentAddressLine1?.trim() || null,
        addressLine2: this.objs.data[i].currentAddressLine2?.trim() || null,
        stateID: this.objs.data[i].currentState,
        districtID: this.objs.data[i].currentDistrict,
        pinCode: this.objs.data[i].currentPincode,
        permAddressLine1:
          this.objs.data[i].permanentAddressLine1?.trim() || null,
        permAddressLine2:
          this.objs.data[i].permanentAddressLine2?.trim() || null,
        permStateID: this.objs.data[i].permanentState,
        permDistrictID: this.objs.data[i].permanenttDistrict,
        permPinCode: this.objs.data[i].permanentPincode,
        statusID: '1',
        isPermanent: this.isPermanent,
        isPresent: this.isPresent,
        createdBy: this.createdBy,
        cityID: '1',
        serviceProviderID: this.serviceProviderID,
        isExternal: this.objs.data[i].isExternal,
      };
      if (this.objs.data[i].dob) {
        const dob = new Date(this.objs.data[i].dob);
        dob.setHours(0, 0, 0, 0);
        tempObj.dOB = dob;
      }
      if (this.objs.data[i].doj && !this.objs.data[i].isExternal) {
        const doj = new Date(this.objs.data[i].doj);
        doj.setHours(0, 0, 0, 0);
        tempObj.dOJ = doj;
      } else {
        tempObj.dOJ = null;
      }
      reqObject.push(tempObj);
    }
    console.log('Details to be saved', reqObject);
    this.employeeMasterNewService.createNewUser(reqObject).subscribe(
      (response) => {
        console.log('response', response.data);
        this.dialogService.alert('Saved successfully', 'success');
        this.objs.data = [];
        this.getAllUserDetails();
        this.showTable();
        this.resetAllFlags();
      },
      (err: any) => {
        console.log('error', err);
        this.dialogService.alert('Failed to create user', 'error');
      },
    );
  }

  showEditForm() {
    this.tableMode = false;
    this.formMode = true;
    this.editMode = true;
  }
  /*
   * Edit user details
   */
  editUserDetails(data: any) {
    console.log('Data to be edit', data);
    this.disabled = false;
    this.showEditForm();
    if (this.formMode === true && this.editMode === true) {
      this.employeeMasterNewService.getCommonRegistrationData().subscribe(
        (res) => this.showGenderOnCondition(res.data),
        (err) => console.log('error', err),
      );

      this.employeeMasterNewService.getAllDesignations().subscribe(
        (res) => this.getAllDesignationsSuccessHandler(res.data),
        (err) => console.log('error', err),
      );

      this.employeeMasterNewService.getAllMaritalStatuses().subscribe(
        (res) => this.getAllMaritalStatusesSuccessHandler(res.data),
        (err) => console.log('error', err),
      );

      this.employeeMasterNewService.getAllQualifications().subscribe(
        (res) => this.getAllQualificationsSuccessHandler(res.data),
        (err) => console.log('error', err),
      );

      this.employeeMasterNewService.getAllCommunities().subscribe(
        (res) => this.getCommunitiesSuccessHandler(res.data),
        (err) => console.log('error', err),
      );

      this.employeeMasterNewService.getAllReligions().subscribe(
        (res) => this.getReligionSuccessHandler(res.data),
        (err) => console.log('error', err),
      );

      this.employeeMasterNewService.getAllStates(this.countryId).subscribe(
        (res) => this.getAllStatesSuccessHandler(res.data),
        (err) => console.log('error', err),
      );

      this.edit(data);
    }
  }

  edit(data: any) {
    // assinging the variable to check the self existing data
    this.selfHealthProfessionalID = null;
    this.selfAadharNo = null;
    this.selfPanNo = null;
    console.log('data', data);
    this.isExternal = data.isExternal;
    if (data.stateID !== null && data.stateID) {
      this.currentState = data.stateID;
      this.getCurrentDistricts(this.currentState);
      this.getPermanentDistricts(data.permStateID);
      if (this.currentDistricts && this.currentDistricts !== null) {
        this.communicationDetailsForm.form.patchValue({
          address: {
            current_addressLine1: data.addressLine1,
            current_addressLine2: data.addressLine2,
            current_state: data.stateID,
            current_district: data.districtID,
            current_pincode: data.pinCode,
          },
          permanent_addressLine1: data.permAddressLine1,
          permanent_addressLine2: data.permAddressLine2,
          permanent_state: data.permStateID,
          permanent_district: data.permDistrictID,
          permanent_pincode: data.permPinCode,
        });
      }
    }
    if (
      data.addressLine1 === data.permAddressLine1 &&
      data.addressLine2 === data.permAddressLine2 &&
      data.stateID === data.permStateID &&
      data.districtID === data.permDistrictID &&
      data.pinCode === data.permPinCode
    ) {
      this.checkAddress = true;
    }
    if (this.isExternal === false) {
      this.patchDojOnEdit = data.dOJ;
      this.manipulateEMpIDAndDOJ = false;
    } else {
      this.manipulateEMpIDAndDOJ = true;
    }
    if (
      data.designationName !== undefined &&
      data.designationName !== null &&
      (data.designationName.toLowerCase() === 'doctor' ||
        data.designationName.toLowerCase() === 'tc specialist')
    ) {
      this.enablehealthProfessionalID = true;
    } else {
      this.enablehealthProfessionalID = false;
    }
    this.userCreationForm.form.patchValue({
      title_Id: data.titleID,
      user_firstname: data.firstName,
      user_middlename: data.middleName,
      user_lastname: data.lastName,
      gender_Id: data.genderID,
      primaryMobileNo: data.contactNo,
      designation: data.designationID,
      emergencyContactNo: data.emergencyContactNo,
      user_dob: data.dOB,
      primaryEmail: data.emailID,
      marital_status: data.maritalStatusID,
      aadhar_number: data.aadhaarNo,
      pan_number: data.pAN,
      edu_qualification: data.qualificationID,
      doj: this.patchDojOnEdit,
    });
    // to patch the value in edit model removing hardcoded variable
    if (
      data.healthProfessionalID !== undefined &&
      data.healthProfessionalID !== null
    ) {
      const editHPIdvalue = data.healthProfessionalID.replace('@hpr.sbx', '');
      this.healthProfessionalID = editHPIdvalue;
      this.selfHealthProfessionalID = editHPIdvalue;
    }
    // assigning duplicate varible to handle sellf existing data
    this.selfAadharNo = data.aadhaarNo;
    this.selfPanNo = data.pAN;

    this.demographicsDetailsForm.form.patchValue({
      father_name: data.fathersName,
      mother_name: data.mothersName,
      community_id: data.communityID,
      religion_id: data.religionID,
    });
    this.userId = data.userID;
    this.createdBy = data.createdBy;
    this.limitDateInEdit(data.dOB);
  }
  limitDateInEdit(dateOfBirth: any) {
    console.log('Limit dateOfBirth', dateOfBirth);
    this.maxdate = new Date();
    this.maxdate.setFullYear(this.today.getFullYear() - 20);
    this.mindate = new Date();
    this.mindate.setFullYear(this.today.getFullYear() - 70);
    this.calculateAgeInEdit(dateOfBirth);
  }
  /*
   * calculate age based on the DOB
   */
  calculateAgeInEdit(dateOfBirth: any) {
    if (dateOfBirth !== undefined) {
      const existDobAge = new Date(dateOfBirth);
      this.age = this.today.getFullYear() - existDobAge.getFullYear();
      const month = this.today.getMonth() - existDobAge.getMonth();
      if (
        month < 0 ||
        (month === 0 && this.today.getDate() < existDobAge.getDate())
      ) {
        this.age--; //age is ng-model of AGE
      }
    }
    this.userCreationForm.form.patchValue({ user_age: this.age });
    this.disabled = true;
  }

  update(
    userCreationFormValue: any,
    demographicsValue: any,
    communicationFormValue: any,
  ) {
    this.searchTerm = null;
    let doj: any = '';
    let dob: any = '';
    let editDoj: any;
    if (this.isExternal === false) {
      if (typeof userCreationFormValue.user_doj === 'string') {
        doj = new Date(userCreationFormValue.doj);
      } else {
        doj = userCreationFormValue.user_doj;
        console.log('doj', doj);
      }
      editDoj = new Date(
        doj.valueOf() - 1 * doj.getTimezoneOffset() * 60 * 1000,
      );
    } else {
      editDoj = null;
    }

    if (typeof userCreationFormValue.user_dob === 'string') {
      dob = new Date(userCreationFormValue.user_dob);
    } else {
      dob = userCreationFormValue.user_dob;
      console.log('dob', dob);
    }
    const update_tempObj = {
      titleID: userCreationFormValue.title_Id,
      firstName: userCreationFormValue.user_firstname,
      middleName: userCreationFormValue.user_middlename,
      lastName: userCreationFormValue.user_lastname,
      genderID: userCreationFormValue.gender_Id,
      dOB: new Date(dob.valueOf() - 1 * dob.getTimezoneOffset() * 60 * 1000),
      //'age': userCreationFormValue.age,
      age: this.age,
      contactNo: userCreationFormValue.primaryMobileNo,
      emailID: userCreationFormValue.primaryEmail,
      designationID: userCreationFormValue.designation,
      maritalStatusID: userCreationFormValue.marital_status,
      aadhaarNo: userCreationFormValue.aadhar_number,
      pAN: userCreationFormValue.pan_number,
      qualificationID: userCreationFormValue.edu_qualification,
      healthProfessionalID:
        userCreationFormValue.healthProfessionalID !== undefined &&
        userCreationFormValue.healthProfessionalID !== null
          ? userCreationFormValue.healthProfessionalID + '@hpr.sbx'
          : userCreationFormValue.healthProfessionalID,
      emergencyContactNo: userCreationFormValue.emergencyContactNo,
      dOJ: editDoj,
      fathersName: demographicsValue.father_name,
      mothersName: demographicsValue.mother_name,
      communityID: demographicsValue.community_id,
      religionID: demographicsValue.religion_id,
      addressLine1: communicationFormValue.address.current_addressLine1,
      addressLine2: communicationFormValue.address.current_addressLine2,
      stateID: communicationFormValue.address.current_state,
      districtID: communicationFormValue.address.current_district,
      pinCode: communicationFormValue.address.current_pincode,
      permAddressLine1: communicationFormValue.permanent_addressLine1,
      permAddressLine2: communicationFormValue.permanent_addressLine2,
      permStateID: communicationFormValue.permanent_state,
      permDistrictID: communicationFormValue.permanent_district,
      permPinCode: communicationFormValue.permanent_pincode,
      userID: this.userId,
      modifiedBy: this.createdBy,
      cityID: 1,
      isExternal: this.isExternal,
    };

    console.log('Data to be update', update_tempObj);

    this.employeeMasterNewService.editUserDetails(update_tempObj).subscribe(
      (response) => {
        console.log('updated obj', response.data);
        this.dialogService.alert('Updated successfully', 'success');
        /* resetting form and ngModels used in editing */
        this.getAllUserDetails();
        this.showTable();
        this.resetAllFlags();
      },
      (err) => {
        console.log('error', err);
        //this.dialogService.alert('error', err);
      },
    );
  }

  /*
   * Activation and deactivation of the user
   */
  activateDeactivate(userID: any, flag: any) {
    const obj = {
      userID: userID,
      deleted: flag,
    };
    if (flag) {
      this.confirmMessage = 'Deactivate';
    } else {
      this.confirmMessage = 'Activate';
    }
    this.dialogService
      .confirm(
        'confirm',
        'Are you sure you want to ' + this.confirmMessage + '?',
      )
      .subscribe(
        (res) => {
          if (res) {
            console.log('Deactivating or activating Obj', obj);
            this.employeeMasterNewService
              .userActivationDeactivation(obj)
              .subscribe(
                (res: any) => {
                  if (res?.statusCode !== 200) {
                    this.dialogService.alert(
                      res?.errorMessage ||
                        'Failed to ' +
                          this.confirmMessage.toLowerCase() +
                          ' the user',
                      'error',
                    );
                    return;
                  }
                  this.dialogService.alert(
                    this.confirmMessage + 'd successfully',
                    'success',
                  );
                  this.getAllUserDetails();
                  this.searchTerm = null;
                },
                (err: any) => {
                  console.log('error', err);
                  this.dialogService.alert(
                    err?.errorMessage ||
                      'Failed to ' +
                        this.confirmMessage.toLowerCase() +
                        ' the user',
                    'error',
                  );
                },
              );
          }
        },
        (err) => {
          console.log(err);
        },
      );
  }

  unlockUserAccount(userID: number, userName: string) {
    this.dialogService
      .confirm(
        'Confirm Unlock',
        `Are you sure you want to unlock the account for user "${userName}"? This will reset their failed login attempts and allow them to log in again.`,
      )
      .subscribe(
        (res) => {
          if (res) {
            this.employeeMasterNewService.unlockUserAccount(userID).subscribe(
              (response: any) => {
                if (response && response.statusCode === 200) {
                  this.dialogService.alert(
                    'User account unlocked successfully. The user can now log in.',
                    'success',
                  );
                  this.getAllUserDetails();
                  this.searchTerm = null;
                } else {
                  this.dialogService.alert(
                    response?.errorMessage || 'Failed to unlock user account',
                    'error',
                  );
                }
              },
              (err) => {
                console.log('error', err);
                this.dialogService.alert(
                  'Error unlocking user account. Please try again.',
                  'error',
                );
              },
            );
          }
        },
        (err) => {
          console.log(err);
        },
      );
  }

  lockUserAccount(userID: number, userName: string) {
    this.dialogService
      .confirm(
        'Confirm Lock',
        `Are you sure you want to lock the account for user "${userName}"? The user will not be able to log in until the account is unlocked or the lock period expires.`,
      )
      .subscribe(
        (res) => {
          if (res) {
            this.employeeMasterNewService.lockUserAccount(userID).subscribe(
              (response: any) => {
                if (response && response.statusCode === 200) {
                  this.dialogService.alert(
                    'User account locked successfully.',
                    'success',
                  );
                  this.getAllUserDetails();
                  this.searchTerm = null;
                } else {
                  this.dialogService.alert(
                    response?.errorMessage || 'Failed to lock user account',
                    'error',
                  );
                }
              },
              (err) => {
                console.log('error', err);
                this.dialogService.alert(
                  'Error locking user account. Please try again.',
                  'error',
                );
              },
            );
          }
        },
        (err) => {
          console.log(err);
        },
      );
  }

  filterComponentList(searchTerm?: string) {
    if (!searchTerm) {
      this.refreshFilteredData(this.searchResult);
      return;
    }

    const normalizedTerm = searchTerm.trim().toLowerCase();
    const filtered = this.searchResult.filter((item: any) =>
      ['userName', 'emergencyContactNo', 'emailID', 'designationName'].some(
        (key) => {
          const value = item[key];
          return (
            value !== undefined &&
            value !== null &&
            value.toString().toLowerCase().includes(normalizedTerm)
          );
        },
      ),
    );

    this.refreshFilteredData(filtered);
  }
  // to enable health professional ID feild upon selecting designation
  enableHPID() {
    this.healthProfessionalID = null;
    const designationNameValue = this.designations.filter((response: any) => {
      if (this.designationID === response.designationID) {
        return response;
      }
    });
    if (
      designationNameValue !== undefined &&
      designationNameValue !== null &&
      (designationNameValue[0].designationName.toLowerCase() === 'doctor' ||
        designationNameValue[0].designationName.toLowerCase() ===
          'tc specialist')
    ) {
      this.enablehealthProfessionalID = true;
    } else {
      this.enablehealthProfessionalID = false;
    }
  }

  uploadMaster() {
    this.employeeMasterUpload = true;
    this.tableMode = false;
    this.formMode = false;
  }

  closeBulkUpload() {
    this.employeeMasterUpload = false;
    this.tableMode = true;
    this.formMode = false;
  }

  private refreshFilteredData(rows: any[]) {
    const safeRows = Array.isArray(rows) ? rows : [];
    console.log('refreshFilteredData rows', safeRows.length);
    this.filteredsearchResult.data = [...safeRows];
    this.setDataSourceAttributes();
    if (this.filteredsearchResult.paginator) {
      this.filteredsearchResult.paginator.firstPage();
    }
    if (!(this.cdr as ViewRef).destroyed) {
      this.cdr.detectChanges();
    }
  }
}
