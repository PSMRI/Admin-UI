import { Component, OnInit } from '@angular/core';
import { ProviderAdminRoleService } from "../services/ProviderAdminServices/state-serviceline-role.service";
import { dataService } from '../services/dataService/data.service';
import { DrugMasterService } from '../services/ProviderAdminServices/drug-master-services.service';
import { ConfirmationDialogsService } from './../services/dialog/confirmation.service';
@Component({
  selector: 'app-drug-mapping',
  templateUrl: './drug-mapping.component.html'
})
export class DrugMappingComponent implements OnInit {

  showMappings:any = true;
  availableDrugMappings:any =[];
  availableDrugGroups:any = [];
  availableDrugs:any = [];
  data:any;
  providerServiceMapID:any;
  provider_states:any;
  provider_services:any;
  service_provider_id:any;
  editable:any = false;
  serviceID104:any;

  constructor(public providerAdminRoleService: ProviderAdminRoleService,
              public commonDataService: dataService,
              public drugMasterService:DrugMasterService,
              private alertMessage: ConfirmationDialogsService) { 
    this.data = [];
    this.service_provider_id =this.commonDataService.service_providerID;
    this.serviceID104 = this.commonDataService.serviceID104;

   }

  ngOnInit() {
    this.getStatesByServiceID();
    this.getAvailableMappings();
    this.getAvailableDrugGroups();
    this.getAvailableDrugs();
  }

  stateSelection(stateID){
    this.getServices(stateID);
  }
  getAvailableMappings(){
    this.drugMasterService.getDrugMappings().subscribe(response => this.getDrugMappingsSuccessHandeler(response));
  }

  getDrugMappingsSuccessHandeler(response){
    this.availableDrugMappings = response;
  }

  getAvailableDrugGroups(){
    this.drugObj = {};
    this.drugObj.deleted = false;
    this.drugMasterService.getDrugGroups(this.drugObj).subscribe(response => this.getDrugGroupsSuccessHandeler(response));
  }
  getDrugGroupsSuccessHandeler(response){
    this.availableDrugGroups = response;
  }

  getAvailableDrugs(){
    this.drugObj = {};
    this.drugObj.deleted = false;
    this.drugMasterService.getDrugsList(this.drugObj).subscribe(response => this.getDrugsSuccessHandeler(response));
  }

  getDrugsSuccessHandeler(response){
    this.availableDrugs = response;
  }

  getServices(stateID)
	{
		this.providerAdminRoleService.getServices(this.service_provider_id,stateID).subscribe(response => this.getServicesSuccessHandeler(response));
	}

  getStates(){
    this.providerAdminRoleService.getStates(this.service_provider_id).subscribe(response=>this.getStatesSuccessHandeler(response));
  }

  getStatesByServiceID(){
    this.drugMasterService.getStatesByServiceID(this.serviceID104,this.service_provider_id).subscribe(response=>this.getStatesSuccessHandeler(response));
  }
  
  
  getStatesSuccessHandeler(response)
	{
		this.provider_states = response;
	}

	getServicesSuccessHandeler(response) {
		this.provider_services = response;
    for(let provider_service of this.provider_services){
      if("104"==provider_service.serviceName){
         this.providerServiceMapID = provider_service.providerServiceMapID;
      }
    } 
	}

  responseHandler(response){
    this.data = response;
  }
  

  showForm(){
    this.showMappings = false;
  }

  drugObj:any ;
  // = {
	// 	'drug':'',
  //   'drugDesc':'',
  //   'providerServiceMapID':'',
  //   'createdBy':''
	// };
  drugMapping:any= [];
  drugIdList:any = [];
  addDrugToList(values){  

    for(let drugIds of values.drugIdList){
      this.drugObj = {};
      this.drugObj.drugGroupID = values.drugGroupID.split("-")[0];
      this.drugObj.drugGroupName = values.drugGroupID.split("-")[1];
      this.drugObj.drugId = drugIds.split("-")[0];
      this.drugObj.drugName = drugIds.split("-")[1];
      this.drugObj.remarks =  values.remarks;
      for(let provider_service of this.provider_services){
        if("104"==provider_service.serviceName){
          this.drugObj.providerServiceMapID =  provider_service.providerServiceMapID;
          this.drugObj.stateName = provider_service.stateName;
        }
      } 

      this.drugObj.createdBy = "System";
      this.drugMapping.push(this.drugObj);
    }
  }

  storedrugMappings(){
    let obj = {"drugMappings":this.drugMapping};
    this.drugMasterService.mapDrugGroups(JSON.stringify(obj)).subscribe(response => this.successHandler(response));
  }

  successHandler(response){
    this.drugMapping =  [];
    this.alertMessage.alert("Drug Mappings stored successfully");
    this.getAvailableMappings();
  }

  dataObj:any ={};
  updateDrugMappingStatus(drugMapping){
   
    this.dataObj ={};
    this.dataObj.drugMapID = drugMapping.drugMapID;
    this.dataObj.deleted = !drugMapping.deleted;
    this.dataObj.modifiedBy = "Admin";
    this.drugMasterService.updateDrugStatus(this.dataObj).subscribe(response => this.updateStatusHandler(response));
    
    drugMapping.deleted = !drugMapping.deleted;

  }

  updateStatusHandler(response){
    console.log("Drug Mapping status changed");
  }
  
  // drugMapID:any;
  // drugGroupID:any;
  // drugGroupName:any;
  // drugId:any;
  // drugName:any;
  // remarks:any;
  // stateID:any;

  // editDrugMapping(drug){

  //   this.drugMapID = drug.drugMapID;
  //   this.drugGroupID = drug.drugGroupID;
  //   this.drugGroupName = drug.drugGroupName;
  //   this.drugId = drug.drugId;
  //   this.drugName = drug.drugName;
  //   this.remarks = drug.remarks;
  //   this.stateID = drug.m_providerServiceMapping.state.stateID;
  //   this.editable = true;
  // }

  // updateDrugMapping(drugMapping){
  //   this.dataObj ={};
  //   this.dataObj.drugGroupID = drugMapping.drugGroupID.split("-")[0];
  //   this.dataObj.drugGroupName = drugMapping.drugGroupID.split("-")[1];
  //   this.dataObj.drugId = drugMapping.drugIdList.split("-")[0];
  //   this.dataObj.drugName = drugMapping.drugIdList.split("-")[1];
  //   this.dataObj.remarks = drugMapping.remarks;
  //   this.dataObj.providerServiceMapID = drugMapping.providerServiceMapID;
  //   this.dataObj.modifiedBy = "Admin";
  //   this.drugMasterService.updateDrugMappings(this.dataObj).subscribe(response => this.updateHandler(response));
    
  // }

  // updateHandler(response){
  //    this.alertMessage.alert("updated successfully");
  //    this.editable = false;
  //    this.getAvailableDrugs();
  // }

}