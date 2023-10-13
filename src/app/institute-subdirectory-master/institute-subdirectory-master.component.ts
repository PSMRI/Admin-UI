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
import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { InstituteSubDirectoryMasterService } from '../services/ProviderAdminServices/institute-subdirectory-master-service.service';
import { dataService } from '../services/dataService/data.service';
import { MdDialog, MdDialogRef } from '@angular/material';
import { MD_DIALOG_DATA } from '@angular/material';
import { ConfirmationDialogsService } from '../services/dialog/confirmation.service';
import { NgForm } from '@angular/forms';

@Component({
	selector: 'app-institute-subdirectory-master',
	templateUrl: './institute-subdirectory-master.component.html',
	styleUrls: ['./institute-subdirectory-master.component.css']
})
export class InstituteSubdirectoryMasterComponent implements OnInit {
	filteredsearchResultArray: any = [];
	/*ngModel*/
	serviceProviderID: any;
	providerServiceMapID: any;

	state: any;
	service: any;
	institute_directory: any;
	institute_subdirectory: any;
	description: any;

	/*arrays*/
	states: any = [];
	services: any = [];
	instituteDirectories: any = [];

	searchResultArray: any = [];
	bufferArray: any = [];
	availableInstituteSubDirectory: any = [];
	instituteSubDirectoryExist: boolean = false;

	/*flags*/
	showTableFlag: boolean = false;
	showFormFlag: boolean = false;
	disableSelection: boolean = false;
	userID: any;
	nationalFlag: any;

	@ViewChild('addInstitutueSubDirForm') addInstitutueSubDirForm: NgForm;
	constructor(public instituteSubDirectoryMasterService: InstituteSubDirectoryMasterService,
		public commonDataService: dataService,
		public dialog: MdDialog,
		public alertService: ConfirmationDialogsService) {
		this.serviceProviderID = this.commonDataService.service_providerID;
	}

	ngOnInit() {
		this.userID = this.commonDataService.uid;

		//	this.instituteSubDirectoryMasterService.getStates(this.serviceProviderID).subscribe(response=>this.getStatesSuccessHandeler(response)); // commented on 10/4/18(1097 regarding changes) Gursimran
		this.instituteSubDirectoryMasterService.getServiceLinesNew(this.userID).subscribe((response) => {
			this.successhandeler(response),
				(err) => {
					console.log("Error", err);
					//this.alertService.alert(err, 'error')
				}

		});
	}

	// getStatesSuccessHandeler(response) {
	// 	if (response) {
	// 		this.states = response;
	// 	}

	// } // commented on 10/4/18(1097 regarding changes) Gursimran

	successhandeler(res) {
		this.services = res.filter(function (item) {
			
				return item;
			
		})
	}
	// getServices(stateID) {
	// 	this.service = ""; //resetting the field on changing state
	// 	this.institute_directory = "";
	// 	this.instituteSubDirectoryMasterService.getServices(this.serviceProviderID, stateID).subscribe(response => this.getServicesSuccessHandeler(response));
	// }

	// getServicesSuccessHandeler(response) {
	// 	if (response) {
	// 		this.services = response.filter(function (item) {
	// 			if (item.serviceID != 6) {
	// 				return item;
	// 			}
	// 		});;
	// 	}

	// }
	getStates(value) {
		console.log("value", value);

		let obj = {
			'userID': this.userID,
			'serviceID': value.serviceID,
			'isNational': value.isNational
		}
		this.instituteSubDirectoryMasterService.getStatesNew(obj).
			subscribe(response => this.getStatesSuccessHandeler(response, value), (err) => {

				console.log("Error", err);
				//his.alertService.alert(err, 'error')
			});
	}

	getStatesSuccessHandeler(response, value) {
		this.states = response;
		this.instituteDirectories = [];
		this.institute_directory = "";
		if (value.isNational) {
			this.nationalFlag = value.isNational;
			this.setProviderServiceMapID(response[0].providerServiceMapID);
			this.showTableFlag = false;
		}
		else {
			this.nationalFlag = value.isNational;
			this.showTableFlag = false;
		}
	}
	setProviderServiceMapID(providerServiceMapID) {
		console.log("providerServiceMapID", providerServiceMapID);
		this.providerServiceMapID = providerServiceMapID;
		this.getInstituteDirectories();
	}

	getInstituteDirectories() {
		this.searchResultArray = [];
		this.filteredsearchResultArray = [];
		this.institute_directory = undefined;
		this.instituteSubDirectoryMasterService.getInstituteDirectory(this.providerServiceMapID).subscribe(response => this.getInstituteDirectorySuccessHandeler(response),
			(err) => {
				console.log("Error", err);
				//this.alertService.alert(err, 'error')
			});

	}

	getInstituteDirectorySuccessHandeler(response) {
		console.log(response, "Institiute Directories");
		if (response) {
			this.instituteDirectories = response.filter(function (item) {
				if (item.deleted === false) {
					return item;
				}
			});
		}
	}

	getInstituteSubdirectory(institute_directory) {
		let data = {
			"instituteDirectoryID": institute_directory,
			"providerServiceMapId": this.providerServiceMapID
		}

		this.instituteSubDirectoryMasterService.getInstituteSubDirectory(data).subscribe(response => this.getInstituteSubDirectorySuccessHandeler(response),
			(err) => {
				console.log("Error", err);
				//this.alertService.alert(err, 'error')
			});


	}

	getInstituteSubDirectorySuccessHandeler(response) {
		if (response) {
			console.log("INSTITUTE SUB DIRECTORY", response);
			this.showTableFlag = true;
			this.searchResultArray = response;
			this.filteredsearchResultArray = response;
			console.log("searcharray", this.searchResultArray);
			for (let availableInstituteSubDirectory of this.searchResultArray) {
				this.availableInstituteSubDirectory.push(availableInstituteSubDirectory.instituteSubDirectoryName);
			}
		}
	}
	checkexistance(institute_subdirectory) {
		this.instituteSubDirectoryExist = this.availableInstituteSubDirectory.includes(institute_subdirectory);
		console.log(this.instituteSubDirectoryExist);
	}
	showForm() {
		this.showTableFlag = false;
		this.showFormFlag = true;

		this.disableSelection = true;
	}

	back() {
		this.alertService.confirm('Confirm', "Do you really want to cancel? Any unsaved data would be lost").subscribe(res => {
			if (res) {
				this.showTableFlag = true;
				this.showFormFlag = false;
				/*reset the input fields of the form*/
				this.institute_subdirectory = "";
				this.description = "";
				this.bufferArray = [];

				this.disableSelection = false;
			}
		})
	}


	clear() {
		/*resetting the search fields*/
		this.state = "";
		this.service = "";
		this.institute_directory = "",
			this.providerServiceMapID = "";

		this.services = [];
		this.instituteDirectories = [];

		/*resetting the flag*/
		this.showTableFlag = false;
		/*resetting the search result array*/
		this.searchResultArray = [];
		this.filteredsearchResultArray = [];
	}

	add_obj(institute_subdirectory, description) {
		let obj = {
			"instituteDirectoryID": this.institute_directory,
			"instituteSubDirectoryName": institute_subdirectory,
			"instituteSubDirectoryDesc": description,
			"providerServiceMapId": this.providerServiceMapID,
			"createdBy": this.commonDataService.uname
		}

		if (this.bufferArray.length == 0 && (obj.instituteSubDirectoryName != "" && obj.instituteSubDirectoryName != undefined)) {
			this.bufferArray.push(obj);
		}
		else {
			let count = 0;
			for (let i = 0; i < this.bufferArray.length; i++) {
				if (obj.instituteSubDirectoryName === this.bufferArray[i].instituteSubDirectoryName) {
					count = count + 1;
				}
			}
			if (count == 0 && (obj.instituteSubDirectoryName != "" && obj.instituteSubDirectoryName != undefined)) {
				this.bufferArray.push(obj);
			}
			else {
				this.alertService.alert("Already exists");
			}
		}

		/*resetting fields after entering in buffer array/or if duplicate exist*/
		this.institute_subdirectory = "";
		this.description = "";
		this.addInstitutueSubDirForm.resetForm();

	}

	removeObj(index) {
		this.bufferArray.splice(index, 1);
	}

	save() {
		this.instituteSubDirectoryMasterService.saveInstituteSubDirectory(this.bufferArray).subscribe(response => this.saveSuccessHandeler(response),
			(err) => {
				console.log("Error", err);
				//this.alertService.alert(err, 'error')
			});
	}

	saveSuccessHandeler(response) {
		if (response) {
			this.alertService.alert("Saved successfully", 'success');
			this.addInstitutueSubDirForm.resetForm();
			this.showFormFlag = false;
			this.bufferArray = [];
			this.getInstituteSubdirectory(this.institute_directory);
			this.disableSelection = false;
		}
	}

	toggle_activate(instituteSubDirectoryID, isDeleted) {
		if (isDeleted === true) {
			this.alertService.confirm('Confirm', "Are you sure you want to Deactivate?").subscribe(response => {
				if (response) {
					let obj = {
						"instituteSubDirectoryID": instituteSubDirectoryID,
						"deleted": isDeleted
					};

					this.instituteSubDirectoryMasterService.toggle_activate_InstituteSubDirectory(obj).subscribe(response => this.toggleActivateSuccessHandeler(response, "Deactivated"),
						(err) => {
							console.log("Error", err);
							//s.alertService.alert(err, 'error')
						});
				}
			});
		}

		if (isDeleted === false) {
			this.alertService.confirm('Confirm', "Are you sure you want to Activate?").subscribe(response => {
				if (response) {
					let obj = {
						"instituteSubDirectoryID": instituteSubDirectoryID,
						"deleted": isDeleted
					};

					this.instituteSubDirectoryMasterService.toggle_activate_InstituteSubDirectory(obj).subscribe(response => this.toggleActivateSuccessHandeler(response, "Activated"),
						(err) => {
							console.log("Error", err);
							//s.alertService.alert(err, 'error')
						});
				}
			});
		}

	}

	toggleActivateSuccessHandeler(response, action) {
		console.log(response, "delete Response");
		if (response) {
			this.alertService.alert(action + " successfully", 'success')
			this.getInstituteSubdirectory(this.institute_directory);
		}
	}


	openEditModal(toBeEditedOBJ) {
		let dialog_Ref = this.dialog.open(EditInstituteSubDirectory, {
			width: '500px',
			data: toBeEditedOBJ
		});

		dialog_Ref.afterClosed().subscribe(result => {
			console.log(`Dialog result: ${result}`);
			if (result === "success") {
				this.alertService.alert("Updated successfully", 'success');
				this.getInstituteSubdirectory(this.institute_directory);
			}

		});

	}
	filterComponentList(searchTerm?: string) {
		if (!searchTerm) {
			this.filteredsearchResultArray = this.searchResultArray;
		} else {
			this.filteredsearchResultArray = [];
			this.searchResultArray.forEach((item) => {
				for (let key in item) {
					if (key == 'instituteSubDirectoryName') {
					let value: string = '' + item[key];
					if (value.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0) {
						this.filteredsearchResultArray.push(item); break;
					}
				}
			}
			});
		}

	}
}



@Component({
	selector: 'edit-institute-subdirectory',
	templateUrl: './edit-institute-subdirectory-modal.html'
})
export class EditInstituteSubDirectory {

	instituteSubDirectory: any;
	description: any;

	constructor(@Inject(MD_DIALOG_DATA) public data: any, public dialog: MdDialog,
		public instituteSubDirectoryMasterService: InstituteSubDirectoryMasterService,
		public commonDataService: dataService, public alertService: ConfirmationDialogsService,
		public dialogReff: MdDialogRef<EditInstituteSubDirectory>) { }

	ngOnInit() {
		console.log("dialog data", this.data);
		this.instituteSubDirectory = this.data.instituteSubDirectoryName;
		this.description = this.data.instituteSubDirectoryDesc;
	}


	update(edited_subdirectory_name, edited_description) {
		let obj = {

			"instituteSubDirectoryID": this.data.instituteSubDirectoryID,
			"instituteSubDirectoryName": edited_subdirectory_name,
			"instituteSubDirectoryDesc": edited_description,
			"modifiedBy": this.commonDataService.uname

		}
		this.instituteSubDirectoryMasterService.editInstituteSubDirectory(obj).subscribe(response => this.updateSuccessHandeler(response),
			(err) => {
				console.log("Error", err);
				//this.alertService.alert(err, 'error')
			});
	}

	updateSuccessHandeler(response) {
		console.log(response, "edit response success");
		if (response) {
			this.dialogReff.close("success");
		}
	}
}
