import { Component, OnInit } from '@angular/core';
import { ProviderAdminRoleService } from "../services/ProviderAdminServices/state-serviceline-role.service";
import { dataService } from '../services/dataService/data.service';
import { ServicePointMasterService } from '../services/ProviderAdminServices/service-point-master-services.service';
import { ConfirmationDialogsService } from './../services/dialog/confirmation.service';

@Component({
    selector: 'app-service-point',
    templateUrl: './service-point.component.html'
})
export class ServicePointComponent implements OnInit {

    showServicePoints: any = true;
    availableServicePoints: any = [];
    data: any;
    providerServiceMapID: any;
    provider_states: any;
    provider_services: any;
    service_provider_id: any;
    editable: any = false;
    availableServicePointNames: any = [];
    countryID: any;
    searchStateID:any;
    searchDistrictID:any;
    searchParkingPlaceID:any;
    serviceID:any;

    constructor(public providerAdminRoleService: ProviderAdminRoleService,
        public commonDataService: dataService,
        public servicePointMasterService: ServicePointMasterService,
        private alertMessage: ConfirmationDialogsService) {
        this.data = [];
        this.service_provider_id = this.commonDataService.service_providerID;
        this.countryID = 1; // hardcoded as country is INDIA
        this.serviceID = this.commonDataService.serviceIDMMU;
    }

    showForm() {
        this.showServicePoints = false;
        this.districts =[];
    }
    ngOnInit() {
        this.getServicePoints(null,null,null);
        //this.getStates();
        this.getStatesByServiceID();
    }

    parkingPlaceObj:any;
    getParkingPlaces(stateID,districtID){
        this.parkingPlaceObj = {};
        this.parkingPlaceObj.stateID = stateID;
        this.parkingPlaceObj.districtID = districtID;
        this.servicePointMasterService.getParkingPlaces(this.parkingPlaceObj).subscribe(response => this.getParkingPlaceSuccessHandler(response));
    }

    availableParkingPlaces:any;
    getParkingPlaceSuccessHandler(response) {
        this.availableParkingPlaces = response;
        for(let availableParkingPlaces of this.availableParkingPlaces){
            if(availableParkingPlaces.deleted){
                const index: number = this.availableParkingPlaces.indexOf(availableParkingPlaces);
                if (index !== -1) {
                    this.availableParkingPlaces.splice(index, 1);
                } 
            }     
        }  
    }

    getServicePoints(stateID,districtID,parkingPlaceID){
        this.servicePointObj = {};
        this.servicePointObj.stateID = stateID;
        this.servicePointObj.districtID = districtID;
        this.servicePointObj.parkingPlaceID = parkingPlaceID;
        this.servicePointMasterService.getServicePoints(this.servicePointObj).subscribe(response => this.getServicePointSuccessHandler(response));

    }

    getServicePointSuccessHandler(response) {
        this.availableServicePoints = response;
        for (let availableServicePoint of this.availableServicePoints) {
            this.availableServicePointNames.push(availableServicePoint.servicePointName);
        }
    }

    servicePointObj: any;
    servicePointList: any = [];
    addServicePointToList(values){
        for (let provider_service of this.provider_services) {
            if ("MMU" == provider_service.serviceName) {
                this.servicePointObj = {};
                this.servicePointObj.servicePointName = values.servicePointName;
                this.servicePointObj.servicePointDesc = values.servicePointDesc;
                this.servicePointObj.countryID = this.countryID;
                
                if(values.stateID!=undefined){
                    this.servicePointObj.stateID = values.stateID.split("-")[0];
                    this.servicePointObj.stateName = values.stateID.split("-")[1];
                }

                if(values.districtID!=undefined){
                    this.servicePointObj.districtID = values.districtID.split("-")[0];
                    this.servicePointObj.districtName = values.districtID.split("-")[1];
                }
                if(values.talukID!=undefined){
                    this.servicePointObj.districtBlockID = values.talukID.split("-")[0];
                    this.servicePointObj.blockName = values.talukID.split("-")[1];
                }
                this.servicePointObj.areaHQAddress = values.areaHQAddress;
                if(values.parkingPlaceID!=undefined){
                    this.servicePointObj.parkingPlaceID = values.parkingPlaceID.split("-")[0];;
                    this.servicePointObj.parkingPlaceName = values.parkingPlaceID.split("-")[1];;
                }
                this.servicePointObj.providerServiceMapID = provider_service.providerServiceMapID;
                    
                this.servicePointObj.createdBy = "Admin";

                this.servicePointList.push(this.servicePointObj);
            }
        }
        if(this.servicePointList.length<=0){
            this.alertMessage.alert("No Service available with the state selected");
        }
    }

    storeServicePoints(){
        let obj = { "servicePoints": this.servicePointList };
        console.log(obj);
        this.servicePointMasterService.saveServicePoint(obj).subscribe(response => this.servicePointSuccessHandler(response));
    }

    servicePointSuccessHandler(response){
        this.servicePointList = [];
        this.alertMessage.alert("Service Points stored successfully");
    }

    stateSelection(stateID) {
        this.getServices(stateID);
    }

    getServices(stateID) {
        this.servicePointMasterService.getServices(this.service_provider_id, stateID).subscribe(response => this.getServicesSuccessHandeler(response));
    }

    getStates() {
        this.servicePointMasterService.getStates(this.service_provider_id).subscribe(response => this.getStatesSuccessHandeler(response));
    }

    getStatesSuccessHandeler(response) {
        this.provider_states = response;
    }

    getStatesByServiceID(){
        this.servicePointMasterService.getStatesByServiceID(this.serviceID,this.service_provider_id).subscribe(response => this.getStatesSuccessHandeler(response));
    }
    

    districts: any = [];
    getDistricts(stateID) {
        this.servicePointMasterService.getDistricts(stateID).subscribe((response: Response) => this.getDistrictsSuccessHandeler(response));
    }
    getDistrictsSuccessHandeler(response) {
        console.log(response, "districts retrieved");
        this.districts = response;
    }
    taluks: any = [];
    GetTaluks(districtID: number) {
        this.servicePointMasterService.getTaluks(districtID)
            .subscribe(response => this.SetTaluks(response));
    }
    SetTaluks(response: any) {
        this.taluks = response;
    }

    branches: any = [];
    GetBranches(talukID: number) {
        this.servicePointMasterService.getBranches(talukID)
            .subscribe(response => this.SetBranches(response));
    }
    SetBranches(response: any) {
        this.branches = response;
    }


    getServicesSuccessHandeler(response) {
        this.provider_services = response;
        for (let provider_service of this.provider_services) {
            if ("MMU" == provider_service.serviceName) {
                this.providerServiceMapID = provider_service.providerServiceMapID;
            }
        }
        if(this.providerServiceMapID=="" || this.providerServiceMapID ==undefined){
            this.alertMessage.alert("No Service available with the state selected");
        }
    }

     dataObj: any = {};
    updateServicePointStatus(servicePoint) {

        this.dataObj = {};
        this.dataObj.servicePointID = servicePoint.servicePointID;
        this.dataObj.deleted = !servicePoint.deleted;
        this.dataObj.modifiedBy = "Admin";
        this.servicePointMasterService.updateServicePointStatus(this.dataObj).subscribe(response => this.updateStatusHandler(response));

        servicePoint.deleted = !servicePoint.deleted;

    }
    updateStatusHandler(response) {
        console.log("Service Point status changed");
    }

    showList(){
        this.searchStateID ="";
        this.searchDistrictID ="";
        this.searchParkingPlaceID = "";
        this.getServicePoints(null,null,null);
        this.showServicePoints=true;
    }

    servicePointNameExist: any = false;
    checkExistance(servicePointName) {
        this.servicePointNameExist = this.availableServicePointNames.includes(servicePointName);
        console.log(this.servicePointNameExist);
    }
    
}