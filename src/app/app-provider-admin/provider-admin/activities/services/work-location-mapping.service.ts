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
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { ConfigService } from 'src/app/core/services/config/config.service';
import { environment } from 'src/environments/environment';

// A "select all" facility pick (e.g. every facility under several Nikshay
// TUs) can put 1000+ IDs on this GET's query string, which blows past the
// server/proxy request-line limit (~8KB) and comes back as a 400. The
// backend only exposes a comma-separated-param GET (no POST/body variant),
// so batch client-side instead of widening a single request.
const NIKSHAY_VILLAGES_BATCH_SIZE = 200;

/**
 * Author: krishna Gunti ( 378952 )
 * Date: 05-03-2018
 * Objective: # A service which would handle the Language Mapping services.
 */

@Injectable()
export class WorkLocationMapping {
  districtID: any;

  constructor(
    private http: HttpClient,
    public basepaths: ConfigService,
  ) {}

  getStates(userID: any, serviceID: any, isNationalFlag: any) {
    return this.http.post(environment.get_State_Url_new, {
      userID: userID,
      serviceID: serviceID,
      isNational: isNationalFlag,
    });
  }

  getServices(userID: any) {
    return this.http.post(environment.get_Service_Url_new, { userID: userID });
  }

  getMappedWorkLocationList(serviceProviderID: any) {
    return this.http.post(environment.get_WorkLocationMappedDetails_Url, {
      serviceProviderID: serviceProviderID,
    });
  }

  getUserName(serviceProviderID: any) {
    return this.http.post(environment.get_ProviderName_Url, {
      serviceProviderID: serviceProviderID,
    });
  }

  getAllMappedRolesForTm(rolesObj: any) {
    return this.http.post(environment.getAllMappedRolesForTmUrl, rolesObj);
  }
  getAllDistricts(stateID: any) {
    return this.http.get(environment.getAllDistrictsUrl + stateID);
  }

  getAllWorkLocations(
    serviceProviderID: any,
    stateID: any,
    serviceID: any,
    isNational: any,
    districtID: any,
  ) {
    this.districtID = districtID;
    return this.http.post(environment.getWorkLocations_url, {
      serviceProviderID: serviceProviderID,
      serviceID: serviceID,
      stateID: stateID,
      isNational: isNational,
      districtID: districtID,
    });
  }
  getAllRoles(providerServiceMapID: any) {
    return this.http.post(environment.get_Roles_Url, {
      providerServiceMapID: providerServiceMapID,
    });
  }
  getAllRolesForTM(providerServiceMapID: any) {
    return this.http.post(environment.getAllRolesForTMUrl, {
      providerServiceMapID: providerServiceMapID,
    });
  }

  SaveWorkLocationMapping(data: any) {
    return this.http.post(
      environment.get_SaveWorkLocationMappedDetails_Url,
      data,
    );
  }

  UpdateWorkLocationMapping(data: any) {
    return this.http.post(
      environment.get_UpdateWorkLocationMappedDetails_Url,
      data,
    );
  }

  DeleteWorkLocationMapping(data: any) {
    return this.http.post(
      environment.get_DeleteWorkLocationMappedDetails_Url,
      data,
    );
  }
  DeleteWorkLocationMappingForTM(data: any) {
    return this.http.post(
      environment.get_DeleteWorkLocationMappedDetailsForTM_Url,
      data,
    );
  }

  getTaluks(districtId: number) {
    return this.http.get(environment._getTalukListURL + districtId);
  }

  // Nikshay location master (Stop TB) — read-only cascading lookups
  getNikshayStates() {
    return this.http.get(environment.nikshayStates_url);
  }

  getNikshayDistricts(stateID: any) {
    return this.http.get(
      `${environment.nikshayDistricts_url}?stateID=${stateID}`,
    );
  }

  getNikshayTUs(districtID: any) {
    return this.http.get(
      `${environment.nikshayTUs_url}?districtID=${districtID}`,
    );
  }

  getNikshayFacilities(tuIDs: any[]) {
    return this.http.get(
      `${environment.nikshayFacilities_url}?tuIDs=${tuIDs.join(',')}`,
    );
  }

  getNikshayVillages(facilityIDs: any[]) {
    const ids = (facilityIDs || []).filter(
      (id) => id !== null && id !== undefined,
    );
    if (!ids.length) {
      return of({ data: [] });
    }
    const chunks: any[][] = [];
    for (let i = 0; i < ids.length; i += NIKSHAY_VILLAGES_BATCH_SIZE) {
      chunks.push(ids.slice(i, i + NIKSHAY_VILLAGES_BATCH_SIZE));
    }
    return forkJoin(
      chunks.map((chunk) =>
        this.http.get(
          `${environment.nikshayVillages_url}?facilityIDs=${chunk.join(',')}`,
        ),
      ),
    ).pipe(
      map((responses: any[]) => ({
        data: responses.reduce(
          (acc: any[], r: any) => acc.concat(r?.data || []),
          [],
        ),
      })),
    );
  }

  // Stop TB Edit: v_userservicerolemapping (backing mappedWorkLocationsList)
  // never exposes DistrictID/NikshayTUID/NikshayFacilityID, so Edit can't
  // read back what was saved from that list alone — this reads the raw
  // table directly for just those fields, by USRMappingID.
  getNikshayUserMappingData(usrMappingID: any) {
    return this.http.get(
      `${environment.nikshayUserMapping_url}?usrMappingID=${usrMappingID}`,
    );
  }
}
