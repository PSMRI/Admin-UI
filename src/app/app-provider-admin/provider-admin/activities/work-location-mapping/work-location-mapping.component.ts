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
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { VillageMasterService } from 'src/app/core/services/adminServices/AdminVillage/village-master-service.service';
import { ConfirmationDialogsService } from 'src/app/core/services/dialog/confirmation.service';
import { WorkLocationMapping } from '../services/work-location-mapping.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { FacilityMasterService } from 'src/app/core/services/inventory-services/facilitytypemaster.service';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface RoleEntry {
  roleID: number;
  roleName: string;
  uSRMappingID: any;
  inbound: any;
  outbound: any;
  teleConsultation: any;
  userServciceRoleDeleted: boolean;
  userDeleted: boolean;
  providerServiceMappingDeleted: boolean;
  facilityID: any;
}

interface GroupedWorkLocation {
  userID: any;
  userName: string;
  realName: string;
  serviceID: any;
  serviceName: string;
  stateID: any;
  stateName: string;
  workingDistrictID: any;
  workingDistrictName: string;
  blockID: any;
  blockName: string;
  providerServiceMapID: any;
  workingLocationID: any;
  locationName: string;
  villageID: any[];
  villageName: any[];
  roles: RoleEntry[];
  roleNamesDisplay: string;
  allDeleted: boolean;
  anyActive: boolean;
  originalRows: any[];
}

@Component({
  selector: 'app-work-location-mapping',
  templateUrl: './work-location-mapping.component.html',
  styleUrls: ['./work-location-mapping.component.css'],
})
export class WorkLocationMappingComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  private destroy$ = new Subject<void>();

  userID: any;
  serviceProviderID: any;
  createdBy: any;
  uSRMappingID: any;
  workLocationID: any;
  providerServiceMapID: any;
  edit = false;
  Role: any;
  User: any;
  State: any;
  Serviceline: any;
  District: any;
  WorkLocation: any;
  Serviceblock: any;
  Servicevillage: any;
  blockId: any;

  // Arrays
  filteredRoles: any = '';
  userNamesList: any = [];
  unmappedUserNamesList: any = [];
  services_array: any = [];
  states_array: any = [];
  districts_array: any = [];
  filteredStates: any = [];
  mappedWorkLocationsList: any = [];
  createUserVillageIDs: number[] = [];
  createUserVillageNames: string[] = [];
  workLocationsList: any = [];
  RolesList: any = [];
  edit_Details: any = [];
  previleges: any = [];
  workLocations: any = [];
  blocks: any = [];
  editblocks: any = [];
  village: any = [];
  editVillageArr: any = [];
  villageEditNameArr: any = [];

  // Search filters for dropdowns
  userSearch = '';
  stateSearch = '';
  districtSearch = '';
  blockSearch = '';

  get filteredUsers(): any[] {
    if (!this.userSearch) return this.unmappedUserNamesList;
    const s = this.userSearch.toLowerCase();
    const selectedID = this.User?.userID;
    return this.unmappedUserNamesList.filter(
      (u: any) =>
        u.userID === selectedID ||
        (
          (u.firstName || '') +
          ' ' +
          (u.lastName || '') +
          ' ' +
          (u.userName || '')
        )
          .toLowerCase()
          .includes(s),
    );
  }

  get filteredStatesList(): any[] {
    if (!this.stateSearch) return this.states_array;
    const s = this.stateSearch.toLowerCase();
    const selectedID = this.State?.stateID;
    return this.states_array.filter(
      (st: any) =>
        st.stateID === selectedID ||
        (st.stateName || '').toLowerCase().includes(s),
    );
  }

  get filteredDistrictsList(): any[] {
    if (!this.districtSearch) return this.districts_array;
    const s = this.districtSearch.toLowerCase();
    const selectedID = this.District?.districtID;
    return this.districts_array.filter(
      (d: any) =>
        d.districtID === selectedID ||
        (d.districtName || '').toLowerCase().includes(s),
    );
  }

  get filteredBlocksList(): any[] {
    if (!this.blockSearch) return this.blocks;
    const s = this.blockSearch.toLowerCase();
    const selectedID = this.Serviceblock?.blockID;
    return this.blocks.filter(
      (b: any) =>
        b.blockID === selectedID ||
        (b.blockName || '').toLowerCase().includes(s),
    );
  }

  villageSearch = '';

  get filteredVillagesList(): any[] {
    if (!this.villageSearch) return this.village;
    const s = this.villageSearch.toLowerCase();
    const selectedNames = new Set(
      (this.Servicevillage || []).map((v: any) => v?.villageName),
    );
    return this.village.filter(
      (v: any) =>
        selectedNames.has(v.villageName) ||
        (v.villageName || '').toLowerCase().includes(s),
    );
  }

  get allVillagesSelected(): boolean {
    if (!this.village?.length) return false;
    const selectedNames = new Set(
      (this.Servicevillage || []).map((v: any) => v?.villageName),
    );
    return this.village.every((v: any) => selectedNames.has(v.villageName));
  }

  toggleSelectAllVillages() {
    if (this.allVillagesSelected) {
      this.Servicevillage = [];
    } else {
      this.Servicevillage = [...this.village];
    }
  }

  // --- Nikshay location master (Stop TB) — District / Block / TU / Facility / Village cascade ---
  // State is AMRIT's own field (needed for providerServiceMapID/roles regardless
  // of service line) — selecting it resolves the matching Nikshay state by name
  // and loads Nikshay's own district list directly into "Select District" for
  // Stop TB. District itself is 100% Nikshay-sourced from there on, no further
  // AMRIT matching — AMRIT's own m_District proved unreliable for this (stale
  // post-2022 district data, orphaned rows, inconsistent between environments).
  isStopTBServiceline = false;
  nikshayStateList: any[] = [];
  nikshayDistrictList: any[] = [];
  nikshayTUList: any[] = [];
  nikshayFacilityList: any[] = [];
  nikshayVillageList: any[] = [];
  selectedNikshayBlock: any = null;
  selectedNikshayTUs: any[] = [];
  selectedNikshayFacilities: any[] = [];
  selectedNikshayVillages: any[] = [];

  nikshayBlockSearch = '';
  nikshayTUSearch = '';
  nikshayFacilitySearch = '';
  nikshayVillageSearch = '';

  get filteredNikshayBlockList(): any[] {
    if (!this.nikshayBlockSearch) return this.nikshayTUList;
    const s = this.nikshayBlockSearch.toLowerCase();
    return this.nikshayTUList.filter((t: any) =>
      (t.tUName || '').toLowerCase().includes(s),
    );
  }

  get filteredNikshayTUList(): any[] {
    if (!this.nikshayTUSearch) return this.nikshayTUList;
    const s = this.nikshayTUSearch.toLowerCase();
    const selectedIDs = new Set(
      (this.selectedNikshayTUs || []).map((t: any) => t.nikshayTUID),
    );
    return this.nikshayTUList.filter(
      (t: any) =>
        selectedIDs.has(t.nikshayTUID) ||
        (t.tUName || '').toLowerCase().includes(s),
    );
  }

  get filteredNikshayFacilityList(): any[] {
    if (!this.nikshayFacilitySearch) return this.nikshayFacilityList;
    const s = this.nikshayFacilitySearch.toLowerCase();
    const selectedIDs = new Set(
      (this.selectedNikshayFacilities || []).map(
        (f: any) => f.nikshayFacilityID,
      ),
    );
    return this.nikshayFacilityList.filter(
      (f: any) =>
        selectedIDs.has(f.nikshayFacilityID) ||
        (f.facilityName || '').toLowerCase().includes(s),
    );
  }

  get filteredNikshayVillageList(): any[] {
    if (!this.nikshayVillageSearch) return this.nikshayVillageList;
    const s = this.nikshayVillageSearch.toLowerCase();
    const selectedIDs = new Set(
      (this.selectedNikshayVillages || []).map((v: any) => v.nikshayVillageID),
    );
    return this.nikshayVillageList.filter(
      (v: any) =>
        selectedIDs.has(v.nikshayVillageID) ||
        (v.villageName || '').toLowerCase().includes(s),
    );
  }

  get allNikshayTUsSelected(): boolean {
    if (!this.nikshayTUList?.length) return false;
    const selectedIDs = new Set(
      (this.selectedNikshayTUs || []).map((t: any) => t.nikshayTUID),
    );
    return this.nikshayTUList.every((t: any) => selectedIDs.has(t.nikshayTUID));
  }

  toggleSelectAllNikshayTUs() {
    this.selectedNikshayTUs = this.allNikshayTUsSelected
      ? []
      : [...this.nikshayTUList];
    this.onNikshayTUChange();
  }

  get allNikshayFacilitiesSelected(): boolean {
    if (!this.nikshayFacilityList?.length) return false;
    const selectedIDs = new Set(
      (this.selectedNikshayFacilities || []).map(
        (f: any) => f.nikshayFacilityID,
      ),
    );
    return this.nikshayFacilityList.every((f: any) =>
      selectedIDs.has(f.nikshayFacilityID),
    );
  }

  toggleSelectAllNikshayFacilities() {
    this.selectedNikshayFacilities = this.allNikshayFacilitiesSelected
      ? []
      : [...this.nikshayFacilityList];
    this.onNikshayFacilityChange();
  }

  get allNikshayVillagesSelected(): boolean {
    if (!this.nikshayVillageList?.length) return false;
    const selectedIDs = new Set(
      (this.selectedNikshayVillages || []).map((v: any) => v.nikshayVillageID),
    );
    return this.nikshayVillageList.every((v: any) =>
      selectedIDs.has(v.nikshayVillageID),
    );
  }

  toggleSelectAllNikshayVillages() {
    this.selectedNikshayVillages = this.allNikshayVillagesSelected
      ? []
      : [...this.nikshayVillageList];
  }

  // Called on District's selectionChange — Stop TB loads the Nikshay TU list
  // directly from the selected (already-Nikshay) district; every other
  // service line keeps its existing AMRIT-driven behavior unchanged.
  onDistrictChange() {
    if (this.isStopTBServiceline) {
      this.loadNikshayTUs((this.District as any)?.nikshayDistrictID);
    } else {
      this.getAllWorkLocations(this.State, this.Serviceline, this.isNational);
      this.getBlockMaster(this.District);
    }
  }

  // Called when AMRIT State is selected, for Stop TB only: resolves the
  // matching Nikshay state by name (low-risk — only ~10 stable state names,
  // no reorganization ambiguity like districts have) and loads its district
  // list directly into "Select District". From here on District is 100%
  // Nikshay-sourced, no further AMRIT matching.
  resolveNikshayStateAndLoadDistricts(state: any) {
    this.nikshayDistrictList = [];
    this.District = null as any;
    this.nikshayTUList = [];
    this.nikshayFacilityList = [];
    this.nikshayVillageList = [];
    this.selectedNikshayBlock = null;
    this.selectedNikshayTUs = [];
    this.selectedNikshayFacilities = [];
    this.selectedNikshayVillages = [];
    if (!state?.stateName) return;

    // AMRIT's m_state spells this "Chattisgarh" (one 'h'); Nikshay's own data
    // spells it "Chhattisgarh" (correct spelling, two 'h's). Every other of
    // the ~10 covered states matches exactly — this is the one known,
    // verified exception, not a general fuzzy-match problem.
    const STATE_NAME_ALIASES: Record<string, string> = {
      chattisgarh: 'chhattisgarh',
    };
    const normalize = (v: string) => {
      const n = (v || '').trim().toLowerCase();
      return STATE_NAME_ALIASES[n] || n;
    };
    const stateName = normalize(state.stateName);

    const resolveWithStates = (states: any[]) => {
      const nikshayState = (states || []).find(
        (s: any) => normalize(s.stateName) === stateName,
      );
      if (!nikshayState) {
        this.alertService.alert(
          `"${state.stateName}" is not yet in Nikshay's location master — districts unavailable until it's imported.`,
          'error',
        );
        return;
      }
      this.worklocationmapping
        .getNikshayDistricts(nikshayState.nikshayStateID)
        .pipe(takeUntil(this.destroy$))
        .subscribe(
          (response: any) => {
            this.nikshayDistrictList = response.data || [];
          },
          () => {
            this.alertService.alert(
              'Failed to load Nikshay districts',
              'error',
            );
          },
        );
    };

    if (this.nikshayStateList?.length) {
      resolveWithStates(this.nikshayStateList);
    } else {
      this.worklocationmapping
        .getNikshayStates()
        .pipe(takeUntil(this.destroy$))
        .subscribe(
          (response: any) => {
            this.nikshayStateList = response.data || [];
            resolveWithStates(this.nikshayStateList);
          },
          () => {
            this.alertService.alert('Failed to load Nikshay states', 'error');
          },
        );
    }
  }

  // Called when Nikshay District is selected — populates both Block (single) and TU (multi)
  loadNikshayTUs(districtID: any) {
    this.nikshayTUList = [];
    this.nikshayFacilityList = [];
    this.nikshayVillageList = [];
    this.selectedNikshayBlock = null;
    this.selectedNikshayTUs = [];
    this.selectedNikshayFacilities = [];
    this.selectedNikshayVillages = [];
    if (!districtID) return;
    this.worklocationmapping
      .getNikshayTUs(districtID)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (response: any) => {
          this.nikshayTUList = response.data || [];
        },
        () => {
          this.alertService.alert('Failed to load Nikshay TUs', 'error');
        },
      );
  }

  // Select Block is a single-select quick-add: picking one TU there adds it
  // into the same selectedNikshayTUs multi-select Select TU manages,
  // instead of being a separate, disconnected filter. Covers the common
  // case (one TU) fast, while Select TU still handles picking more. Shared
  // by both Create and Edit — operates purely on component state, not
  // tied to either form.
  onNikshayBlockChange() {
    if (this.selectedNikshayBlock) {
      const alreadySelected = (this.selectedNikshayTUs || []).some(
        (t: any) => t.nikshayTUID === this.selectedNikshayBlock.nikshayTUID,
      );
      if (!alreadySelected) {
        this.selectedNikshayTUs = [
          ...(this.selectedNikshayTUs || []),
          this.selectedNikshayBlock,
        ];
      }
    }
    this.onNikshayTUChange();
  }

  // Called whenever the TU multi-select changes
  onNikshayTUChange() {
    this.nikshayFacilityList = [];
    this.nikshayVillageList = [];
    this.selectedNikshayFacilities = [];
    this.selectedNikshayVillages = [];
    const tuIDs = (this.selectedNikshayTUs || []).map(
      (t: any) => t.nikshayTUID,
    );
    if (!tuIDs.length) return;
    this.worklocationmapping
      .getNikshayFacilities(tuIDs)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (response: any) => {
          this.nikshayFacilityList = response.data || [];
        },
        () => {
          this.alertService.alert('Failed to load Nikshay facilities', 'error');
        },
      );
  }

  // Called whenever the Facility multi-select changes
  onNikshayFacilityChange() {
    this.nikshayVillageList = [];
    this.selectedNikshayVillages = [];
    const facilityIDs = (this.selectedNikshayFacilities || []).map(
      (f: any) => f.nikshayFacilityID,
    );
    if (!facilityIDs.length) return;
    this.worklocationmapping
      .getNikshayVillages(facilityIDs)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (response: any) => {
          this.nikshayVillageList = response.data || [];
        },
        () => {
          this.alertService.alert('Failed to load Nikshay villages', 'error');
        },
      );
  }

  resetNikshaySelection() {
    this.nikshayStateList = [];
    this.nikshayDistrictList = [];
    this.nikshayTUList = [];
    this.nikshayFacilityList = [];
    this.nikshayVillageList = [];
    this.selectedNikshayBlock = null;
    this.selectedNikshayTUs = [];
    this.selectedNikshayFacilities = [];
    this.selectedNikshayVillages = [];
    this.nikshayBlockSearch = '';
    this.nikshayTUSearch = '';
    this.nikshayFacilitySearch = '';
    this.nikshayVillageSearch = '';
  }

  /**
   * Edit mode: find this worker's Stop TB row(s), pull out the TU/Facility
   * IDs from their comma-joined lists plus the Village ID array, then load
   * each dropdown's option list and pre-select the matching entries.
   */
  loadNikshayEditSelections() {
    this.resetNikshaySelection();

    const splitIDs = (value: any): number[] =>
      String(value || '')
        .split(',')
        .map((v: string) => Number(v.trim()))
        .filter((n: number) => !isNaN(n));

    // edit_Details IS this user-role's row already (set directly in
    // editGroupedRow/editRow) — read villageidDb/stateName straight off it
    // instead of re-filtering mappedWorkLocationsList by roleName, which
    // can silently come up empty on a mismatch and quietly break every
    // fallback that depended on it (district list, village pre-selection).
    // row.villageID (the transient array field on the backend entity) is
    // write-only — it's never populated when reading from the DB, only
    // when the frontend sends it on save. villageidDb is the raw
    // comma-joined string column, which IS populated on read.
    const uniqueVillageIDs = [
      ...new Set(splitIDs(this.edit_Details?.villageidDb)),
    ];

    // NikshayTUID/NikshayFacilityID/DistrictID are comma-joined/direct
    // values on m_userservicerolemapping (see setWorkLocationObject), but
    // v_userservicerolemapping — what mappedWorkLocationsList is built from
    // — never exposes those columns. Fetch them straight from the raw table
    // by USRMappingID instead.
    const usrMappingID = this.uSRMappingID || this.edit_Details.uSRMappingID;
    if (!usrMappingID) {
      return;
    }

    this.worklocationmapping
      .getNikshayUserMappingData(usrMappingID)
      .pipe(takeUntil(this.destroy$))
      .subscribe((response: any) => {
        const data = response?.data || {};
        const existingTUIDs = splitIDs(data.nikshayTUID);
        const existingFacilityIDs = splitIDs(data.nikshayFacilityID);
        // BlockID/BlockName on m_userservicerolemapping ARE the saved
        // "Select Block" value — stamped by onNikshayBlockChange() at save
        // time, independent of how many TUs ended up in NikshayTUID.
        // getNikshayUserMappingData's raw-table response does NOT include
        // these two columns (verified against live UAT response — only
        // nikshayTUID/nikshayFacilityID/districtID come back), so pull it
        // from edit_Details instead — the row is already sitting there
        // with blockID/blockName intact, sourced from getUserRoleMapped
        // (v_userservicerolemapping) when the row was opened for Edit.
        const savedBlockID = parseInt(this.edit_Details?.blockID, 10);

        // DistrictID is repurposed to hold the Nikshay district ID directly
        // for Stop TB rows (AMRIT's own DistrictID is never used for Stop
        // TB — see setWorkLocationObject). Rows saved after that fix can
        // use it straight away, no name matching needed.
        const savedNikshayDistrictID = parseInt(data.districtID, 10);
        if (!isNaN(savedNikshayDistrictID) && savedNikshayDistrictID) {
          this.district_duringEdit = savedNikshayDistrictID;
          // nikshayDistrictList also needs populating — it's what the
          // "Select District" dropdown's options come from in edit mode —
          // otherwise the resolved ID has nothing to display against.
          this.loadNikshayDistrictListForEdit(this.edit_Details?.stateName);
          this.loadNikshayTUsForEditContinued(
            savedNikshayDistrictID,
            existingTUIDs,
            existingFacilityIDs,
            uniqueVillageIDs,
            savedBlockID,
          );
          return;
        }

        // Old-style user (mapped through the pre-Nikshay AMRIT flow), or a
        // fresh row with nothing selected yet: no saved Nikshay DistrictID
        // to resolve from. District/TU/Facility/Village are left fully
        // blank — deliberately NOT guessed from the row's old AMRIT
        // WorkingDistrictName, since that name space doesn't reliably line
        // up with Nikshay's. Only User/Serviceline/Role carry over from
        // the old row; the admin picks fresh Nikshay values and Update
        // re-saves this worker on the new schema. district_duringEdit is
        // explicitly cleared here — editGroupedRow/editRow already set it
        // to the row's old AMRIT district ID earlier for every service
        // line, which would otherwise show as a bogus selection against
        // the Nikshay district list. The District dropdown's OPTIONS still
        // populate from the one thing reliably known (State); the dropdown
        // is editable for Stop TB (see template) and picking a district
        // calls onNikshayDistrictChangeEdit().
        this.district_duringEdit = null;
        const rowStateName = this.edit_Details?.stateName;
        if (rowStateName) {
          this.loadNikshayDistrictListForEdit(rowStateName);
        }
      });
  }

  onNikshayDistrictChangeEdit() {
    this.selectedNikshayBlock = null;
    this.selectedNikshayTUs = [];
    this.selectedNikshayFacilities = [];
    this.selectedNikshayVillages = [];
    this.nikshayTUList = [];
    this.nikshayFacilityList = [];
    this.nikshayVillageList = [];
    if (!this.district_duringEdit) {
      return;
    }
    this.worklocationmapping
      .getNikshayTUs(this.district_duringEdit)
      .pipe(takeUntil(this.destroy$))
      .subscribe((response: any) => {
        this.nikshayTUList = response.data || [];
      });
  }

  // Populates nikshayDistrictList (the "Select District" dropdown's option
  // source in edit mode) for a known state name. If amritDistrictName is
  // given, also tries a best-effort name match against it and auto-selects
  // on a hit — meaningful only for genuinely old, pre-Nikshay rows that
  // went through the old AMRIT work-location flow and therefore have a
  // real WorkingDistrictName (rows saved through the newer Nikshay flow
  // never set WorkingLocationID at all, so this never fires for them —
  // they fall through to the plain empty-options case, same as before).
  private loadNikshayDistrictListForEdit(stateName: string) {
    const STATE_NAME_ALIASES: Record<string, string> = {
      chattisgarh: 'chhattisgarh',
    };
    const normalize = (v: string) => {
      const n = (v || '').trim().toLowerCase();
      return STATE_NAME_ALIASES[n] || n;
    };
    const normStateName = normalize(stateName);

    const resolveAndLoad = (states: any[]) => {
      const nikshayState = (states || []).find(
        (s: any) => normalize(s.stateName) === normStateName,
      );
      if (!nikshayState) return;
      this.worklocationmapping
        .getNikshayDistricts(nikshayState.nikshayStateID)
        .pipe(takeUntil(this.destroy$))
        .subscribe((distResponse: any) => {
          this.nikshayDistrictList = distResponse.data || [];
        });
    };

    if (this.nikshayStateList?.length) {
      resolveAndLoad(this.nikshayStateList);
    } else {
      this.worklocationmapping
        .getNikshayStates()
        .pipe(takeUntil(this.destroy$))
        .subscribe((response: any) => {
          this.nikshayStateList = response.data || [];
          resolveAndLoad(this.nikshayStateList);
        });
    }
  }

  private loadNikshayTUsForEdit(
    stateName: string,
    districtName: string,
    existingTUIDs: any[],
    existingFacilityIDs: any[],
    uniqueVillageIDs: any[],
  ) {
    const STATE_NAME_ALIASES: Record<string, string> = {
      chattisgarh: 'chhattisgarh',
    };
    const normalize = (v: string) => {
      const n = (v || '').trim().toLowerCase();
      return STATE_NAME_ALIASES[n] || n;
    };
    const normStateName = normalize(stateName);
    const normDistrictName = normalize(districtName);

    const resolveDistrict = (states: any[]) => {
      const nikshayState = (states || []).find(
        (s: any) => normalize(s.stateName) === normStateName,
      );
      if (!nikshayState) return;
      this.worklocationmapping
        .getNikshayDistricts(nikshayState.nikshayStateID)
        .pipe(takeUntil(this.destroy$))
        .subscribe((distResponse: any) => {
          const districts = distResponse.data || [];
          const nikshayDistrict = districts.find(
            (d: any) => normalize(d.districtName) === normDistrictName,
          );
          if (!nikshayDistrict) return;
          // Pre-select District itself, same object shape Create uses.
          this.District = nikshayDistrict;
          this.district_duringEdit = nikshayDistrict.nikshayDistrictID;
          this.loadNikshayTUsForEditContinued(
            nikshayDistrict.nikshayDistrictID,
            existingTUIDs,
            existingFacilityIDs,
            uniqueVillageIDs,
          );
        });
    };

    if (this.nikshayStateList?.length) {
      resolveDistrict(this.nikshayStateList);
    } else {
      this.worklocationmapping
        .getNikshayStates()
        .pipe(takeUntil(this.destroy$))
        .subscribe((response: any) => {
          this.nikshayStateList = response.data || [];
          resolveDistrict(this.nikshayStateList);
        });
    }
  }

  private loadNikshayTUsForEditContinued(
    nikshayDistrictID: any,
    existingTUIDs: any[],
    existingFacilityIDs: any[],
    uniqueVillageIDs: any[],
    savedBlockID?: number,
  ) {
    this.worklocationmapping
      .getNikshayTUs(nikshayDistrictID)
      .pipe(takeUntil(this.destroy$))
      .subscribe((tuResponse: any) => {
        this.nikshayTUList = tuResponse.data || [];
        this.selectedNikshayTUs = this.nikshayTUList.filter((t: any) =>
          existingTUIDs.includes(t.nikshayTUID),
        );
        // "Select Block" is a single-select quick-add convenience over this
        // same TU list (see onNikshayBlockChange), but the saved BlockID IS
        // its own real value on the row (stamped there at save time) —
        // independent of how many TUs ended up in NikshayTUID afterwards.
        // Look it up directly instead of guessing off selectedNikshayTUs.
        this.selectedNikshayBlock =
          savedBlockID && !isNaN(savedBlockID)
            ? this.nikshayTUList.find(
                (t: any) => t.nikshayTUID === savedBlockID,
              ) || null
            : null;
        if (!this.selectedNikshayTUs.length) return; // old user: nothing to pre-select, but list is loaded and usable

        const tuIDs = this.selectedNikshayTUs.map((t: any) => t.nikshayTUID);
        this.worklocationmapping
          .getNikshayFacilities(tuIDs)
          .pipe(takeUntil(this.destroy$))
          .subscribe((facResponse: any) => {
            this.nikshayFacilityList = facResponse.data || [];
            this.selectedNikshayFacilities = this.nikshayFacilityList.filter(
              (f: any) => existingFacilityIDs.includes(f.nikshayFacilityID),
            );
            if (!this.selectedNikshayFacilities.length) return;

            const facilityIDs = this.selectedNikshayFacilities.map(
              (f: any) => f.nikshayFacilityID,
            );
            this.worklocationmapping
              .getNikshayVillages(facilityIDs)
              .pipe(takeUntil(this.destroy$))
              .subscribe((villResponse: any) => {
                this.nikshayVillageList = villResponse.data || [];
                this.selectedNikshayVillages = this.nikshayVillageList.filter(
                  (v: any) => uniqueVillageIDs.includes(v.nikshayVillageID),
                );
              });
          });
      });
  }

  //  flag values
  formMode = false;
  tableMode = true;
  editMode = false;
  disableUsername = false;
  saveButtonStatus = false;
  duplicatestatus = false;
  duplicatestatus_editPart = false;

  isNational = false;
  blockFlag = false;
  isFacilityServiceline = false;

  // Edit-mode facility integration
  isFacilityServicelineEdit = false;
  isStopTBServicelineEdit = false;
  editExistingVillageIDs: number[] = [];
  editExistingVillageNames: string[] = [];
  editExistingFacilityID: any = null;
  editExistingFacilityIDs: any[] = [];
  editExistingFacilityNames: string[] = [];
  editExistingFacilityName = '';
  editExistingFacilityTypeID: any = null;
  editExistingRuralUrban = '';
  editIsAshaSupervisor = false;
  editAshaMappingPairs: { uSRMappingID: any; facilityID: any }[] = [];
  editFacilityMappingData: any = null;
  editRoleName = '';
  editServiceName = '';
  editSupervisorUserID: any = null;

  villageFlag = false;
  searchTerm: any;
  enableEditBlockFlag = false;
  enableEditVillageFlag = false;
  teleConsultationFlag = false;
  teleConsultation: any;
  teleConsultationEditFlag = false;
  esanjFlag = false;
  teleConsultationEdit: any;
  foundDuplicate = false;

  displayedColumns: string[] = [
    'SNo',
    'UserName',
    'Serviceline',
    'State',
    'District',
    'Block',
    'Village',
    'FacilityID',
    'Role',
    'Inbound',
    'Outbound',
    'edit',
    'action',
  ];
  displayedColumnsTable2: string[] = [
    'SNo',
    'UserName',
    'Serviceline',
    'State',
    'District',
    'Block',
    'Village',
    'FacilityID',
    'Role',
    'Inbound',
    'Outbound',
    'TeleConsultation',
    'delete',
  ];
  filteredmappedWorkLocationsList = new MatTableDataSource<any>();
  bufferArray = new MatTableDataSource<any>();
  groupedBufferArray = new MatTableDataSource<any>();
  groupedWorkLocationsList: GroupedWorkLocation[] = [];
  editGroupedElement: GroupedWorkLocation | null = null;
  roleIDs_duringEdit: number[] = [];
  facilityNameMap = new Map<number, string>();
  editFacilityLoading = false;

  // ASHA Supervisor separate table
  ashaSupervisorGroupedList: GroupedWorkLocation[] = [];
  filteredAshaSupervisorList = new MatTableDataSource<any>();
  ashaSupervisorColumns: string[] = [
    'SNo',
    'UserName',
    'State',
    'District',
    'Facilities',
    'edit',
    'action',
  ];

  @ViewChild('paginatorFirst') paginatorFirst!: MatPaginator;
  @ViewChild('paginatorSecond') paginatorSecond!: MatPaginator;
  @ViewChild('paginatorAsha') paginatorAsha!: MatPaginator;
  @ViewChild('sortFirst') sortFirst!: MatSort;
  @ViewChild('sortSecond') sortSecond!: MatSort;
  @ViewChild('sortAsha') sortAsha!: MatSort;
  @ViewChild('workplaceform')
  eForm!: NgForm;
  @ViewChild('workplaceeform')
  editWorkplaceForm!: NgForm;
  showInOutBound = false;
  isInbound = false;
  isOutbound = false;
  showInOutBoundEdit = false;
  singleSelectForEcd = false;
  disableSelectRoles = false;
  ServiceEditblock: any;
  private _fix15WarnConfirmed = false; // Fix 15: re-entry guard for location-change warning
  villagename: any;
  blockname: any;
  blockid: any;
  serviceEditvillage: any;
  villageid: any;
  villageIdValue: any;
  item: any;
  workplaceform: any;
  isVillageRequired = false;
  isBlockRequired = false;
  isBlockRequiredEdit = false;

  constructor(
    private alertService: ConfirmationDialogsService,
    private worklocationmapping: WorkLocationMapping,
    private villagemasterService: VillageMasterService,
    readonly sessionstorage: SessionStorageService,
    private facilityMasterService: FacilityMasterService,
  ) {}

  ngOnInit() {
    this.serviceProviderID = this.sessionstorage.getItem('service_providerID');
    this.userID = this.sessionstorage.getItem('uid');
    this.createdBy = this.sessionstorage.getItem('uname');
    this.getProviderServices(this.userID);
    this.getAllMappedWorkLocations();
    this.getUserName(this.serviceProviderID);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    this.filteredmappedWorkLocationsList.paginator = this.paginatorFirst;
    this.filteredmappedWorkLocationsList.sort = this.sortFirst;
    this.bufferArray.paginator = this.paginatorSecond;
    this.bufferArray.sort = this.sortSecond;
  }

  setIsNational(value: any) {
    this.isNational = value;
  }

  getStates(serviceID: any, isNational: any) {
    this.availableRoles = [];
    this.worklocationmapping
      .getStates(this.userID, serviceID, isNational)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (response: any) =>
          this.getStatesSuccessHandeler(response.data, isNational),
        (err: any) => {
          this.alertService.alert('Failed to load states', 'error');
        },
      );
  }

  getStatesSuccessHandeler(response: any, isNational: any) {
    this.State = '';
    if (response) {
      console.log(response, 'Provider States');
      this.states_array = response;
      this.districts_array = [];
      this.workLocationsList = [];
      this.RolesList = [];

      if (isNational) {
        this.State = '';
        this.District = '';
        this.getAllWorkLocations(
          this.states_array[0],
          this.Serviceline,
          this.Serviceline.isNational,
        );
      }
    }
  }
  getProviderServices(userID: any) {
    this.worklocationmapping
      .getServices(userID)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (response: any) => {
          this.services_array = response.data;
        },
        (err: any) => {
          this.alertService.alert('Failed to load services', 'error');
        },
      );
  }
  getAllMappedWorkLocations() {
    this.worklocationmapping
      .getMappedWorkLocationList(this.serviceProviderID)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (response: any) => {
          if (response) {
            console.log(
              'All Mapped Work Locations List Success Handeler',
              response,
            );
            this.mappedWorkLocationsList = response.data;
            const allGroups = this.groupWorkLocations(response.data);

            // Separate ASHA Supervisor groups into a dedicated table
            // Include both active and deactivated supervisors
            const ashaSupervisorGroups = allGroups.filter(
              (g: GroupedWorkLocation) =>
                g.roles.some(
                  (r) => (r.roleName || '').toLowerCase() === 'asha supervisor',
                ),
            );
            const otherGroups = allGroups.filter(
              (g: GroupedWorkLocation) =>
                !g.roles.some(
                  (r) => (r.roleName || '').toLowerCase() === 'asha supervisor',
                ),
            );

            // Merge ASHA Supervisor groups by userID (handles multiple facility rows)
            this.ashaSupervisorGroupedList =
              this.mergeAshaSupervisorGroups(ashaSupervisorGroups);
            this.groupedWorkLocationsList = otherGroups;

            // Update real names from SearchEmployee4 data (userNamesList)
            this.updateRealNamesInGroupedList();
            this.filteredmappedWorkLocationsList.data =
              this.groupedWorkLocationsList;
            this.filteredAshaSupervisorList.data =
              this.ashaSupervisorGroupedList;
            if (this.paginatorFirst) {
              this.filteredmappedWorkLocationsList.paginator =
                this.paginatorFirst;
            }
            if (this.sortFirst) {
              this.filteredmappedWorkLocationsList.sort = this.sortFirst;
            }
            if (this.paginatorAsha) {
              this.filteredAshaSupervisorList.paginator = this.paginatorAsha;
            }
            if (this.sortAsha) {
              this.filteredAshaSupervisorList.sort = this.sortAsha;
            }
            // Load facility names for groups that have facilityIDs
            this.loadFacilityNamesForGroups();
            this.updateUnmappedUsersList();
          }
        },
        (err: any) => {
          this.alertService.alert('Failed to load work locations', 'error');
        },
      );
  }

  groupWorkLocations(flatRows: any[]): GroupedWorkLocation[] {
    const groupMap = new Map<string, GroupedWorkLocation>();

    for (const row of flatRows) {
      // Group rows for HWC/FLW (including ASHA Supervisor) and Stop TB by
      // user+block (Stop TB's "block" is the Nikshay TU — see blockIDToUse
      // in updateGroupedWorkLocation) so multiple roles for the same
      // user+location show as one row with multiple role chips, instead of
      // a separate row per role. Other services still get one row per entry.
      const isFacilityService =
        row.serviceName === 'HWC' ||
        row.serviceName === 'FLW' ||
        row.serviceName === 'Stop TB';
      let key: string;
      if (isFacilityService) {
        key = [
          row.userID,
          row.serviceID,
          row.stateID || '',
          row.workingDistrictID || '',
          row.blockID || '',
        ].join('|');
      } else {
        key = `single_${row.uSRMappingID}`;
      }

      if (!groupMap.has(key)) {
        groupMap.set(key, {
          userID: row.userID,
          userName: row.userName,
          realName: ((row.firstName || '') + ' ' + (row.lastName || '')).trim(),
          serviceID: row.serviceID,
          serviceName: row.serviceName,
          stateID: row.stateID,
          stateName: row.stateName,
          workingDistrictID: row.workingDistrictID,
          workingDistrictName: row.workingDistrictName,
          blockID: row.blockID,
          blockName: row.blockName,
          providerServiceMapID: row.providerServiceMapID,
          workingLocationID: row.workingLocationID,
          locationName: row.locationName,
          villageID: Array.isArray(row.villageID) ? [...row.villageID] : [],
          villageName: Array.isArray(row.villageName)
            ? [...row.villageName]
            : [],
          roles: [],
          roleNamesDisplay: '',
          allDeleted: true,
          anyActive: false,
          originalRows: [],
        });
      }

      const group = groupMap.get(key)!;
      group.originalRows.push(row);

      if (Array.isArray(row.villageID) && !row.userServciceRoleDeleted) {
        for (const vid of row.villageID) {
          if (!group.villageID.includes(vid)) {
            group.villageID.push(vid);
          }
        }
      }
      if (Array.isArray(row.villageName) && !row.userServciceRoleDeleted) {
        for (const vn of row.villageName) {
          if (!group.villageName.includes(vn)) {
            group.villageName.push(vn);
          }
        }
      }

      if (!group.locationName && row.locationName) {
        group.locationName = row.locationName;
        group.workingLocationID = row.workingLocationID;
      }

      const alreadyHasRole = group.roles.some(
        (r) => r.uSRMappingID === row.uSRMappingID,
      );
      if (!alreadyHasRole) {
        group.roles.push({
          roleID: row.roleID,
          roleName: row.roleName,
          uSRMappingID: row.uSRMappingID,
          inbound: row.inbound,
          outbound: row.outbound,
          teleConsultation: row.teleConsultation,
          userServciceRoleDeleted: row.userServciceRoleDeleted,
          userDeleted: row.userDeleted,
          providerServiceMappingDeleted: row.providerServiceMappingDeleted,
          facilityID: row.facilityID,
        });
      }

      const isRowDeleted =
        row.userServciceRoleDeleted ||
        row.userDeleted ||
        row.providerServiceMappingDeleted;
      if (!isRowDeleted) {
        group.allDeleted = false;
        group.anyActive = true;
      }
    }

    for (const group of groupMap.values()) {
      const uniqueRoleNames = [...new Set(group.roles.map((r) => r.roleName))];
      group.roleNamesDisplay = uniqueRoleNames.join(', ');
      group.allDeleted = group.roles.every(
        (r) =>
          r.userServciceRoleDeleted ||
          r.userDeleted ||
          r.providerServiceMappingDeleted,
      );
      group.anyActive = !group.allDeleted;
    }

    return Array.from(groupMap.values());
  }

  /**
   * Merge multiple ASHA Supervisor groups (which may have been split by blockID)
   * into one group per userID. This guarantees 1 row per ASHA Supervisor in the table.
   */
  mergeAshaSupervisorGroups(
    groups: GroupedWorkLocation[],
  ): GroupedWorkLocation[] {
    const mergeMap = new Map<any, GroupedWorkLocation>();

    for (const group of groups) {
      const key = group.userID;
      if (!mergeMap.has(key)) {
        // Clone the first group as base
        mergeMap.set(key, {
          ...group,
          roles: [...group.roles],
          villageID: [...group.villageID],
          villageName: [...group.villageName],
          originalRows: [...group.originalRows],
        });
      } else {
        const existing = mergeMap.get(key)!;
        // Merge roles (deduplicate by uSRMappingID)
        for (const role of group.roles) {
          if (
            !existing.roles.some((r) => r.uSRMappingID === role.uSRMappingID)
          ) {
            existing.roles.push(role);
          }
        }
        // Merge villages
        for (const vid of group.villageID) {
          if (!existing.villageID.includes(vid)) {
            existing.villageID.push(vid);
          }
        }
        for (const vn of group.villageName) {
          if (!existing.villageName.includes(vn)) {
            existing.villageName.push(vn);
          }
        }
        // Merge original rows
        existing.originalRows.push(...group.originalRows);
      }
    }

    // Recalculate display fields
    for (const group of mergeMap.values()) {
      group.roleNamesDisplay = [
        ...new Set(group.roles.map((r) => r.roleName)),
      ].join(', ');
      group.allDeleted = group.roles.every(
        (r) =>
          r.userServciceRoleDeleted ||
          r.userDeleted ||
          r.providerServiceMappingDeleted,
      );
      group.anyActive = !group.allDeleted;
    }

    return Array.from(mergeMap.values());
  }

  getUserName(serviceProviderID: any) {
    this.worklocationmapping
      .getUserName(serviceProviderID)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (response: any) => {
          if (response) {
            console.log(
              'All User names under this provider Success Handeler',
              response,
            );
            this.userNamesList = response.data;
            this.states_array = [];
            this.districts_array = [];
            this.workLocationsList = [];
            this.RolesList = [];
            // Update real names in grouped list (SearchEmployee4 has firstName/lastName)
            this.updateRealNamesInGroupedList();
            this.updateUnmappedUsersList();
          }
        },
        (err: any) => {
          this.alertService.alert('Failed to load users', 'error');
        },
      );
  }

  updateRealNamesInGroupedList() {
    if (!this.userNamesList) return;
    const nameMap = new Map<number, string>();
    for (const user of this.userNamesList) {
      const name = (
        (user.firstName || '') +
        ' ' +
        (user.lastName || '')
      ).trim();
      if (name) nameMap.set(user.userID, name);
    }
    if (this.groupedWorkLocationsList) {
      for (const group of this.groupedWorkLocationsList) {
        const name = nameMap.get(group.userID);
        if (name) group.realName = name;
      }
    }
    if (this.ashaSupervisorGroupedList) {
      for (const group of this.ashaSupervisorGroupedList) {
        const name = nameMap.get(group.userID);
        if (name) group.realName = name;
      }
    }
  }

  updateUnmappedUsersList() {
    if (!this.userNamesList || !this.mappedWorkLocationsList) {
      this.unmappedUserNamesList = this.userNamesList || [];
      return;
    }
    // Collect userIDs that have at least one active (non-deleted) mapping
    const mappedUserIDs = new Set<number>();
    for (const row of this.mappedWorkLocationsList) {
      const isDeleted =
        row.userServciceRoleDeleted ||
        row.userDeleted ||
        row.providerServiceMappingDeleted;
      if (!isDeleted && row.userID) {
        mappedUserIDs.add(row.userID);
      }
    }
    this.unmappedUserNamesList = this.userNamesList.filter(
      (user: any) => !mappedUserIDs.has(user.userID),
    );
  }

  getAllDistricts(serviceID: any, user: any, state: any) {
    this.showAlertsForMappedRoles(
      serviceID,
      user.userID,
      state.providerServiceMapID,
    );
    this.worklocationmapping
      .getAllDistricts(state.stateID || state)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (response: any) => {
          if (response) {
            console.log(response, 'get all districts success handeler');
            this.districts_array = response.data;
            this.workLocationsList = [];
            this.RolesList = [];
          }
        },
        (err: any) => {
          this.alertService.alert('Failed to load districts', 'error');
        },
      );
    this.disableSelectRoles = false; //For resetting the disbaled selected role field on change of states
  }
  showAlertsForMappedRoles(
    serviceID: any,
    userID: any,
    providerServiceMapID: any,
  ) {
    const reqObj = {
      userID: userID,
      providerServiceMapID: providerServiceMapID,
    };
    this.worklocationmapping
      .getAllMappedRolesForTm(reqObj)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (response: any) => {
          response.data.forEach((mappedRolesOfTm: any) => {
            if (
              mappedRolesOfTm.screenName === 'TC Specialist' ||
              mappedRolesOfTm.screenName === 'Supervisor'
            ) {
              this.alertService.alert(
                'This user is already mapped to supervisor/TC Specialist',
              );
              this.State = null;
            }
          });
        },
        (err: any) => {
          this.alertService.alert('Failed to load mapped roles', 'error');
        },
      );
    if (this.bufferArray.data.length > 0) {
      this.bufferArray.data.forEach((bufferScreenList: any) => {
        if (
          bufferScreenList.providerServiceMapID === providerServiceMapID &&
          bufferScreenList.userID === userID &&
          (bufferScreenList.roleID1[0].screenName === 'TC Specialist' ||
            bufferScreenList.roleID1[0].screenName === 'Supervisor')
        ) {
          this.alertService.alert(
            'This user is already mapped to supervisor/TC Specialist',
          );
          this.State = null;
        }
      });
      this.bufferArray.paginator = this.paginatorSecond;
    }
  }

  getAllWorkLocations(state: any, service: any, isNational: any) {
    // HWC/FLW: no workingLocationID dependency — skip API call
    if (this.isFacilityServiceline) {
      return;
    }
    this.worklocationmapping
      .getAllWorkLocations(
        this.serviceProviderID,
        state.stateID || state,
        service.serviceID || service,
        isNational,
        this.District.districtID,
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (response: any) => {
          if (response) {
            console.log(response, 'get all work locations success handeler');
            this.workLocationsList = response.data;
            this.RolesList = [];
          }
        },
        (err: any) => {
          this.alertService.alert('Failed to load work locations', 'error');
        },
      );
  }

  getAllRoles(serviceID: any, providerServiceMapID: any, userID: any) {
    if (serviceID === 4) {
      this.worklocationmapping
        .getAllRolesForTM(providerServiceMapID)
        .pipe(takeUntil(this.destroy$))
        .subscribe(
          (response: any) => {
            console.log(response, 'get all roles success handeler');
            this.RolesList = response.data;
            if (this.RolesList) {
              this.checkExistance(serviceID, providerServiceMapID, userID);
            }
          },
          (err: any) => {
            this.alertService.alert('Failed to load roles', 'error');
          },
        );
    } else {
      this.teleConsultationFlag = false;
      this.teleConsultation = null;
      const psmID = providerServiceMapID
        ? providerServiceMapID
        : this.states_array[0].providerServiceMapID;
      this.worklocationmapping
        .getAllRoles(psmID)
        .pipe(takeUntil(this.destroy$))
        .subscribe(
          (response: any) => {
            console.log(response, 'get all roles success handeler');
            this.RolesList = response.data;
            if (this.RolesList) {
              this.checkExistance(serviceID, psmID, userID);
            }
          },
          (err: any) => {
            this.alertService.alert('Failed to load roles', 'error');
          },
        );
    }
  }
  existingRoles: any = [];
  availableRoles: any = [];
  bufferArrayTemp: any = [];
  bufferRoleIds: any = [];

  supAndSpecScreenNames: any = [];
  bufferSupAndSpecScreenNames: any = [];

  checkExistance(serviceID: any, providerServiceMapID: any, userID: any) {
    this.existingRoles = [];
    this.bufferRoleIds = [];
    this.disableSelectRoles = false;
    this.mappedWorkLocationsList.forEach((mappedWorkLocations: any) => {
      if (
        mappedWorkLocations.serviceName === 'ECD' &&
        mappedWorkLocations.providerServiceMapID !== undefined &&
        mappedWorkLocations.providerServiceMapID === providerServiceMapID &&
        mappedWorkLocations.userID === userID
      ) {
        if (!mappedWorkLocations.userServciceRoleDeleted) {
          this.disableSelectRoles = true;
          return;
        }
      } else if (
        mappedWorkLocations.providerServiceMapID !== undefined &&
        mappedWorkLocations.providerServiceMapID === providerServiceMapID &&
        mappedWorkLocations.userID === userID
      ) {
        if (
          (serviceID === 2 || serviceID === 4) &&
          !this.editMode &&
          parseInt(mappedWorkLocations.stateID) === this.State.stateID &&
          parseInt(mappedWorkLocations.workingDistrictID) ===
            this.District.districtID &&
          !mappedWorkLocations.userServciceRoleDeleted
        ) {
          this.existingRoles.push(mappedWorkLocations.roleID);
        } else if (
          (serviceID === 2 || serviceID === 4) &&
          this.editMode &&
          parseInt(mappedWorkLocations.stateID) === this.stateID_duringEdit &&
          parseInt(mappedWorkLocations.workingDistrictID) ===
            this.district_duringEdit &&
          !mappedWorkLocations.userServciceRoleDeleted
        ) {
          this.existingRoles.push(mappedWorkLocations.roleID);
        } else if (
          serviceID !== 2 &&
          serviceID !== 4 &&
          !mappedWorkLocations.userServciceRoleDeleted
        ) {
          this.existingRoles.push(mappedWorkLocations.roleID); // existing roles has roles which are already mapped.
        }
      }
    });
    this.availableRoles = this.RolesList.slice();

    // Also collect existing role NAMES to block duplicate-named roles (e.g. two "Asha" with different roleIDs)
    const existingRoleNames = this.mappedWorkLocationsList
      .filter(
        (m: any) =>
          m.userID === userID &&
          m.providerServiceMapID === providerServiceMapID &&
          !m.userServciceRoleDeleted,
      )
      .map((m: any) => (m.roleName || '').toLowerCase());

    const temp: any = [];
    this.availableRoles.forEach((roles: any) => {
      const idBlocked = this.existingRoles.indexOf(roles.roleID) >= 0;
      const nameBlocked = existingRoleNames.includes(
        (roles.roleName || '').toLowerCase(),
      );
      if (!idBlocked && !nameBlocked) {
        temp.push(roles);
      }
    });
    this.availableRoles = temp.slice();
    if (this.bufferArray.data.length > 0) {
      this.bufferArray.data.forEach((bufferList: any) => {
        if (
          bufferList.userID === userID &&
          bufferList.providerServiceMapID === providerServiceMapID
        ) {
          if (bufferList.roleID1.length > 0) {
            this.availableRoles.forEach((removeScreenNameOfSupAndSpec: any) => {
              if (
                removeScreenNameOfSupAndSpec.screenName === 'TC Specialist' ||
                removeScreenNameOfSupAndSpec.screenName === 'Supervisor'
              ) {
                this.bufferSupAndSpecScreenNames.push(
                  removeScreenNameOfSupAndSpec.screenName,
                );
              }
            });
          }
        }
      });
    }
    this.availableRoles.forEach((removeScreenNameOfSupAndSpec: any) => {
      if (
        removeScreenNameOfSupAndSpec.screenName === 'TC Specialist' ||
        removeScreenNameOfSupAndSpec.screenName === 'Supervisor'
      ) {
        this.supAndSpecScreenNames.push(
          removeScreenNameOfSupAndSpec.screenName,
        );
      }
    });
    const tempsupAndSpecScreenNames: any = [];
    if (this.existingRoles.length > 0) {
      this.availableRoles.forEach((screenNames: any) => {
        const index = this.supAndSpecScreenNames.indexOf(
          screenNames.screenName,
        );
        if (index < 0) {
          tempsupAndSpecScreenNames.push(screenNames);
        }
      });
      this.availableRoles = tempsupAndSpecScreenNames.slice();
    }

    if (this.bufferArray.data.length > 0) {
      this.bufferArray.data.forEach((bufferArrayList: any) => {
        if (
          bufferArrayList.serviceName === 'ECD' &&
          bufferArrayList.userID === userID &&
          bufferArrayList.providerServiceMapID === providerServiceMapID
        ) {
          this.disableSelectRoles = true;
          return;
        } else if (bufferArrayList.userID === userID) {
          this.bufferArrayTemp.push(bufferArrayList.roleID1);
        }
      });
    }
    this.bufferArrayTemp.forEach((roleId: any) => {
      roleId.forEach((role: any) => {
        this.bufferRoleIds.push(role.roleID1);
      });
    });
    const bufferTemp: any = [];
    this.availableRoles.forEach((bufferRoles: any) => {
      const index = this.bufferRoleIds.indexOf(bufferRoles.roleID);
      if (index < 0) {
        bufferTemp.push(bufferRoles);
      }
    });
    this.availableRoles = bufferTemp.slice();
    const bufferTempsupAndSpecScreenNames: any[] = [];
    this.availableRoles.forEach((screenNames: any) => {
      const index = this.bufferSupAndSpecScreenNames.indexOf(
        screenNames.screenName,
      );
      if (index < 0) {
        bufferTempsupAndSpecScreenNames.push(screenNames);
      }
    });
    this.availableRoles = bufferTempsupAndSpecScreenNames.slice();

    // reset all buffer values
    this.bufferArrayTemp = [];
    this.bufferSupAndSpecScreenNames = [];
    this.supAndSpecScreenNames = [];
  }

  allowSingleRoleOnlyForECD(serviceline: any) {
    if (serviceline === 'ECD' || serviceline === 'FLW') {
      this.singleSelectForEcd = true;
    } else {
      this.singleSelectForEcd = false;
    }
  }

  resetRole() {
    this.Role = null;
  }

  showTable() {
    if (this.editMode) {
      this.tableMode = true;
      this.formMode = false;
      this.editMode = false;
      this.bufferArray.data = [];
      this.bufferArray.paginator = this.paginatorSecond;
      this.editWorkplaceForm.resetForm();
      this.showInOutBoundEdit = false;
      this.isOutboundEdit = false;
      this.isInboundEdit = false;
      this.searchTerm = null;
      this.disableSelectRoles = false;
      this.teleConsultationEditFlag = false;
      this.teleConsultationEdit = null;
      this.isFacilityServicelineEdit = false;
      this.editExistingVillageIDs = [];
      this.editExistingVillageNames = [];
      this.editExistingFacilityID = null;
      this.editExistingFacilityIDs = [];
      this.editExistingFacilityNames = [];
      this.editAshaMappingPairs = [];
      this.editIsAshaSupervisor = false;
      this.editFacilityMappingData = null;
      this.editFacilityLoading = false;
      this.editGroupedElement = null;
      this.roleIDs_duringEdit = [];
    } else {
      if (this.bufferArray.data.length > 0) {
        this.tableMode = true;
        this.formMode = false;
        this.editMode = false;
        this.bufferArray.data = [];
        this.bufferArray.paginator = this.paginatorSecond;
        this.eForm.resetForm();
        this.isNational = false;
        this.isInbound = false;
        this.isOutbound = false;
        this.showInOutBound = false;
        this.teleConsultation = null;
        this.teleConsultationFlag = false;
        this.availableRoles = [];
        this.RolesList = [];
        this.searchTerm = null;
        this.disableSelectRoles = false;
      } else {
        this.tableMode = true;
        this.formMode = false;
        this.editMode = false;
        this.bufferArray.data = [];
        this.bufferArray.paginator = this.paginatorSecond;
        this.eForm.resetForm();
        this.isNational = false;
        this.isInbound = false;
        this.isOutbound = false;
        this.showInOutBound = false;
        this.teleConsultation = null;
        this.teleConsultationFlag = false;
        this.availableRoles = [];
        this.RolesList = [];
        this.searchTerm = null;
        this.disableSelectRoles = false;
      }
    }
  }
  back() {
    this.alertService
      .confirm(
        'confirm',
        'Do you really want to go back? Any unsaved data would be lost',
      )
      .subscribe((response: any) => {
        if (response) {
          this.showTable();
          this.getAllMappedWorkLocations();
        }
      });
  }
  showForm() {
    this.tableMode = false;
    this.formMode = true;
    this.editMode = false;
    this.edit = false;
    this.isInbound = false;
    this.isOutbound = false;
  }
  showEditForm() {
    this.tableMode = false;
    this.formMode = false;
    this.editMode = true;
    this.edit = true;
    this.isInbound = false;
    this.isOutbound = false;
  }

  activate(
    userID: any,
    serviceID: any,
    uSRMappingID: any,
    userDeactivated: any,
    providerServiceMappingDeleted: any,
    stateID: any,
    workingDistrictID: any,
    blockID: any,
    roleID: any,
  ) {
    if (userDeactivated) {
      this.alertService.alert('User is inactive');
    } else if (providerServiceMappingDeleted) {
      this.alertService.alert('State is inactive');
    } else {
      if (serviceID === 4) {
        this.alertService
          .confirm('confirm', 'Are you sure you want to Activate?')
          .subscribe((response: any) => {
            if (response) {
              const object = {
                uSRMappingID: uSRMappingID,
                deleted: false,
              };

              this.worklocationmapping
                .DeleteWorkLocationMappingForTM(object)
                .pipe(takeUntil(this.destroy$))
                .subscribe(
                  (response: any) => {
                    if (response) {
                      this.alertService.alert(
                        'Activated successfully',
                        'success',
                      );
                      /* refresh table */
                      this.searchTerm = null;
                      this.getAllMappedWorkLocations();
                    }
                  },
                  (err: any) => {
                    this.alertService.alert('Failed to activate', 'error');
                  },
                );
            }
          });
      } else if (serviceID === 9) {
        const result = false;
        this.foundDuplicate = false;
        if (this.mappedWorkLocationsList.length !== 0) {
          this.mappedWorkLocationsList.forEach((mappedWorkLocations: any) => {
            if (
              serviceID === 9 &&
              serviceID === mappedWorkLocations.serviceID &&
              stateID === mappedWorkLocations.stateID &&
              workingDistrictID === mappedWorkLocations.workingDistrictID &&
              blockID === mappedWorkLocations.blockID &&
              mappedWorkLocations.userID === userID &&
              uSRMappingID !== mappedWorkLocations.uSRMappingID &&
              roleID === mappedWorkLocations.roleID
            ) {
              if (!mappedWorkLocations.userServciceRoleDeleted) {
                this.foundDuplicate = true;
              }
            }
          });
        }
        if (this.mappedWorkLocationsList.length !== 0) {
          this.mappedWorkLocationsList.forEach((mappedWorkLocations: any) => {
            if (
              serviceID === 9 &&
              serviceID === mappedWorkLocations.serviceID &&
              stateID !== mappedWorkLocations.stateID &&
              workingDistrictID !== mappedWorkLocations.workingDistrictID &&
              blockID !== mappedWorkLocations.blockID &&
              mappedWorkLocations.userID === userID &&
              uSRMappingID !== mappedWorkLocations.uSRMappingID
            ) {
              if (!mappedWorkLocations.userServciceRoleDeleted) {
                this.foundDuplicate = true;
              }
            }
          });
        }
        if (this.foundDuplicate === false) {
          this.alertService
            .confirm('confirm', 'Are you sure you want to Activate?')
            .subscribe((response: any) => {
              if (response) {
                const object = {
                  uSRMappingID: uSRMappingID,
                  deleted: false,
                };

                this.worklocationmapping
                  .DeleteWorkLocationMapping(object)
                  .pipe(takeUntil(this.destroy$))
                  .subscribe(
                    (response: any) => {
                      if (response) {
                        this.alertService.alert(
                          'Activated successfully',
                          'success',
                        );
                        /* refresh table */
                        this.searchTerm = null;
                        this.getAllMappedWorkLocations();
                      }
                    },
                    (err: any) => {
                      this.alertService.alert('Failed to activate', 'error');
                    },
                  );
              }
            });
        } else {
          this.alertService.alert(
            'Service Already Actiavted either with same demographic or with same role',
          );
        }
      } else {
        this.alertService
          .confirm('confirm', 'Are you sure you want to Activate?')
          .subscribe((response: any) => {
            if (response) {
              const object = {
                uSRMappingID: uSRMappingID,
                deleted: false,
              };

              this.worklocationmapping
                .DeleteWorkLocationMapping(object)
                .pipe(takeUntil(this.destroy$))
                .subscribe(
                  (response: any) => {
                    if (response) {
                      this.alertService.alert(
                        'Activated successfully',
                        'success',
                      );
                      /* refresh table */
                      this.searchTerm = null;
                      this.getAllMappedWorkLocations();
                    }
                  },
                  (err: any) => {
                    this.alertService.alert('Failed to activate', 'error');
                  },
                );
            }
          });
      }
    }
  }
  deactivate(serviceID: any, uSRMappingID: any) {
    if (serviceID === 4) {
      this.alertService
        .confirm('confirm', 'Are you sure you want to Deactivate?')
        .subscribe((response: any) => {
          if (response) {
            const object = { uSRMappingID: uSRMappingID, deleted: true };

            this.worklocationmapping
              .DeleteWorkLocationMappingForTM(object)
              .pipe(takeUntil(this.destroy$))
              .subscribe(
                (res: any) => {
                  if (res) {
                    this.alertService.alert(
                      'Deactivated successfully',
                      'success',
                    );
                    /* refresh table */
                    this.searchTerm = null;
                    this.getAllMappedWorkLocations();
                  }
                },
                (err: any) => {
                  this.alertService.alert('Failed to deactivate', 'error');
                },
              );
          }
        });
    } else {
      this.alertService
        .confirm('confirm', 'Are you sure you want to Deactivate?')
        .subscribe((response: any) => {
          if (response) {
            const object = { uSRMappingID: uSRMappingID, deleted: true };

            this.worklocationmapping
              .DeleteWorkLocationMapping(object)
              .pipe(takeUntil(this.destroy$))
              .subscribe(
                (res: any) => {
                  if (res) {
                    this.alertService.alert(
                      'Deactivated successfully',
                      'success',
                    );
                    /* refresh table */
                    this.searchTerm = null;
                    this.getAllMappedWorkLocations();
                  }
                },
                (err: any) => {
                  this.alertService.alert('Failed to deactivate', 'error');
                },
              );
          }
        });
    }
  }
  addWorkLocation(objectToBeAdded: any, role: any) {
    const statesIDEdit =
      objectToBeAdded.serviceline.isNational === false
        ? objectToBeAdded.state.providerServiceMapID
        : this.states_array[0].providerServiceMapID;
    const districtEdit =
      objectToBeAdded.serviceline.isNational === false
        ? objectToBeAdded.district.districtID
        : null;
    console.log(objectToBeAdded, 'FORM VALUES');
    if (objectToBeAdded.serviceline.serviceName === '1097') {
      if (
        (this.isInbound === false || this.isInbound === null) &&
        (this.isOutbound === false || this.isOutbound === null) &&
        objectToBeAdded.role.some(
          (item: any) => item.roleName.toLowerCase() !== 'supervisor',
        )
      ) {
        this.alertService.alert('Select checkbox Inbound/Outbound/Both');
      } else {
        if (
          objectToBeAdded.role.some(
            (item: any) => item.roleName.toLowerCase() === 'supervisor',
          ) &&
          (this.isOutbound === true || this.isInbound === true)
        ) {
          this.alertService.alert(
            "Supervisor doesn't have the privilege for Inbound/Outbound",
          );
        }

        if (objectToBeAdded.role.length > 0) {
          if (objectToBeAdded.role.length === 1) {
            for (let a = 0; a < objectToBeAdded.role.length; a++) {
              const obj = {
                roleID1: objectToBeAdded.role[a].roleID,
                roleName: objectToBeAdded.role[a].roleName,
                screenName: objectToBeAdded.role[a].screenName,
              };
              if (
                objectToBeAdded.role[a].roleName.toLowerCase() === 'supervisor'
              )
                this.setWorkLocationObject(objectToBeAdded, obj, false, false);
              else
                this.setWorkLocationObject(
                  objectToBeAdded,
                  obj,
                  objectToBeAdded.Inbound,
                  objectToBeAdded.Outbound,
                );
            }
          } else {
            if (objectToBeAdded.role.length > 1) {
              for (let i = 0; i < objectToBeAdded.role.length; i++) {
                if (
                  objectToBeAdded.role[i].screenName === 'TC Specialist' ||
                  objectToBeAdded.role[i].screenName === 'Supervisor'
                ) {
                  this.Role = null;
                  this.alertService.alert('Invaild role mapping');
                  break;
                } else {
                  const obj = {
                    roleID1: objectToBeAdded.role[i].roleID,
                    roleName: objectToBeAdded.role[i].roleName,
                    screenName: objectToBeAdded.role[i].screenName,
                  };
                  if (
                    objectToBeAdded.role[i].roleName.toLowerCase() ===
                    'supervisor'
                  )
                    this.setWorkLocationObject(
                      objectToBeAdded,
                      obj,
                      false,
                      false,
                    );
                  else
                    this.setWorkLocationObject(
                      objectToBeAdded,
                      obj,
                      objectToBeAdded.Inbound,
                      objectToBeAdded.Outbound,
                    );
                }
              }
            }
          }

          this.resetAllArrays();
          this.isNational = false;
        }
        if (this.bufferArray.data.length > 0) {
          this.eForm.resetForm();
          this.bufferArray.paginator = this.paginatorSecond;
        }
        console.log('Result Array', this.bufferArray);
      }
    } else if (objectToBeAdded.serviceline.serviceName === 'ECD') {
      const obj = {
        roleID1: objectToBeAdded.role.roleID,
        roleName: objectToBeAdded.role.roleName,
        screenName: objectToBeAdded.role.screenName,
      };
      this.setWorkLocationObject(objectToBeAdded, obj, false, false);
      if (this.bufferArray.data.length > 0) {
        this.eForm.resetForm();
        this.bufferArray.paginator = this.paginatorSecond;
      }
      console.log('Result Array', this.bufferArray);
      if (this.bufferArray.data.length > 0) {
        this.eForm.resetForm();
        this.bufferArray.paginator = this.paginatorSecond;
      }
    } else if (objectToBeAdded.serviceline.serviceName === 'FLW') {
      const obj = {
        roleID1: objectToBeAdded.role.roleID,
        roleName: objectToBeAdded.role.roleName,
        screenName: objectToBeAdded.role.screenName,
      };
      this.setWorkLocationObject(objectToBeAdded, obj, false, false);
      this.resetAllArrays();
      if (this.bufferArray.data.length > 0) {
        this.eForm.resetForm();
        this.bufferArray.paginator = this.paginatorSecond;
      }
    } else if (objectToBeAdded.serviceline.serviceName === 'HWC') {
      const result: boolean = this.checkHWCDuplicateBufferArray();
      const result2: boolean = this.checkHWCDuplicateMainArray();
      if (result === true || result2 === true) {
        this.alertService.alert(
          'Same User Already Mapped with different State and District',
        );
      } else {
        if (objectToBeAdded.role.length > 0) {
          if (objectToBeAdded.role.length === 1) {
            for (let a = 0; a < objectToBeAdded.role.length; a++) {
              const obj = {
                roleID1: objectToBeAdded.role[a].roleID,
                roleName: objectToBeAdded.role[a].roleName,
                screenName: objectToBeAdded.role[a].screenName,
                teleConsultation:
                  objectToBeAdded.serviceline.serviceName === 'HWC' &&
                  (objectToBeAdded.role[a].roleName.toLowerCase() === 'nurse' ||
                    objectToBeAdded.role[a].roleName.toLowerCase() ===
                      'doctor') &&
                  this.teleConsultation
                    ? this.teleConsultation
                    : null,
              };
              this.setWorkLocationObject(objectToBeAdded, obj, false, false);
            }
          } else {
            if (objectToBeAdded.role.length > 1) {
              for (let i = 0; i < objectToBeAdded.role.length; i++) {
                if (
                  objectToBeAdded.role[i].screenName === 'TC Specialist' ||
                  objectToBeAdded.role[i].screenName === 'Supervisor'
                ) {
                  this.Role = null;
                  this.alertService.alert('Invaild role mapping');
                  break;
                } else {
                  const obj = {
                    roleID1: objectToBeAdded.role[i].roleID,
                    roleName: objectToBeAdded.role[i].roleName,
                    screenName: objectToBeAdded.role[i].screenName,
                    teleConsultation:
                      objectToBeAdded.serviceline.serviceName === 'HWC' &&
                      (objectToBeAdded.role[i].roleName.toLowerCase() ===
                        'nurse' ||
                        objectToBeAdded.role[i].roleName.toLowerCase() ===
                          'doctor') &&
                      this.teleConsultation
                        ? this.teleConsultation
                        : null,
                  };
                  this.setWorkLocationObject(
                    objectToBeAdded,
                    obj,
                    false,
                    false,
                  );
                }
              }
            }
          }
          this.resetAllArrays();
        }
        if (this.bufferArray.data.length > 0) {
          this.eForm.resetForm();
          this.bufferArray.paginator = this.paginatorSecond;
          this.disableSelectRoles = false;
        }
      }
    } else {
      if (objectToBeAdded.role.length > 0) {
        if (objectToBeAdded.role.length === 1) {
          for (let a = 0; a < objectToBeAdded.role.length; a++) {
            const obj = {
              roleID1: objectToBeAdded.role[a].roleID,
              roleName: objectToBeAdded.role[a].roleName,
              screenName: objectToBeAdded.role[a].screenName,
              teleConsultation:
                objectToBeAdded.serviceline.serviceName === 'HWC' &&
                (objectToBeAdded.role[a].roleName.toLowerCase() === 'nurse' ||
                  objectToBeAdded.role[a].roleName.toLowerCase() ===
                    'doctor') &&
                this.teleConsultation
                  ? this.teleConsultation
                  : null,
            };
            this.setWorkLocationObject(objectToBeAdded, obj, false, false);
          }
        } else {
          if (objectToBeAdded.role.length > 1) {
            for (let i = 0; i < objectToBeAdded.role.length; i++) {
              if (
                objectToBeAdded.role[i].screenName === 'TC Specialist' ||
                objectToBeAdded.role[i].screenName === 'Supervisor'
              ) {
                this.Role = null;
                this.alertService.alert('Invaild role mapping');
                break;
              } else {
                const obj = {
                  roleID1: objectToBeAdded.role[i].roleID,
                  roleName: objectToBeAdded.role[i].roleName,
                  screenName: objectToBeAdded.role[i].screenName,
                  teleConsultation:
                    objectToBeAdded.serviceline.serviceName === 'HWC' &&
                    (objectToBeAdded.role[i].roleName.toLowerCase() ===
                      'nurse' ||
                      objectToBeAdded.role[i].roleName.toLowerCase() ===
                        'doctor') &&
                    this.teleConsultation
                      ? this.teleConsultation
                      : null,
                };

                this.setWorkLocationObject(objectToBeAdded, obj, false, false);
              }
            }
          }
        }

        this.resetAllArrays();
      }

      if (this.bufferArray.data.length > 0) {
        this.eForm.resetForm();
        this.bufferArray.paginator = this.paginatorSecond;
        this.disableSelectRoles = false;
      }
      console.log('Result Array', this.bufferArray);
    }
  }

  setWorkLocationObject(
    objectToBeAdded: any,
    obj: any,
    InboundValue: any,
    OnboundValue: any,
  ) {
    // Stop TB — Nikshay TU/Facility/Village: a single row per user-role,
    // carrying all selected TUs/Facilities/Villages as comma-joined lists
    // (NikshayTUID/NikshayFacilityID are TEXT columns, same idea as
    // Villageid already was). Previously this looped one row per TU x
    // Facility combination, which multiplied rows for no reason (e.g. 10
    // TUs x 100 facilities = 1,000 rows for one user/role).
    if (this.isStopTBServiceline) {
      const roleObjStopTB = [obj];
      const providerServiceMapID =
        objectToBeAdded.serviceline.isNational === false
          ? objectToBeAdded.state.providerServiceMapID
          : this.states_array[0].providerServiceMapID;

      const tuIDArrTB: any[] = [];
      const tuNameArrTB: any[] = [];
      (this.selectedNikshayTUs || []).forEach((tu: any) => {
        tuIDArrTB.push(tu.nikshayTUID);
        tuNameArrTB.push(tu.tUName);
      });

      const facilityIDArrTB: any[] = [];
      const facilityNameArrTB: any[] = [];
      (this.selectedNikshayFacilities || []).forEach((facility: any) => {
        facilityIDArrTB.push(facility.nikshayFacilityID);
        facilityNameArrTB.push(facility.facilityName);
      });

      const villageIDArrTB: any[] = [];
      const villageNameArrTB: any[] = [];
      (this.selectedNikshayVillages || []).forEach((village: any) => {
        villageIDArrTB.push(village.nikshayVillageID);
        villageNameArrTB.push(village.villageName);
      });

      const stopTBWorkLocationObj: any = {
        previleges: [],
        userID: objectToBeAdded.user.userID,
        userName: objectToBeAdded.user.userName,
        serviceID: objectToBeAdded.serviceline.serviceID,
        serviceName: objectToBeAdded.serviceline.serviceName,
        roleID1: roleObjStopTB,
        providerServiceMapID: providerServiceMapID,
        createdBy: this.createdBy,
        stateID: objectToBeAdded.state?.stateID || null,
        stateName: objectToBeAdded.state?.stateName || 'All States',
        // DistrictID is repurposed to hold the Nikshay district ID for Stop
        // TB (AMRIT's own DistrictID is never used here — District is 100%
        // Nikshay-sourced). The Create form's District control binds the
        // NikshayDistrict object, whose ID field is nikshayDistrictID, not
        // districtID — reading .districtID here always came back null.
        districtID: objectToBeAdded.district?.nikshayDistrictID || null,
        district: objectToBeAdded.district?.districtName || null,
        // Block is a single-value legacy field (both ID and Name). Store
        // whichever TU the admin actually picked via "Select Block"
        // (selectedNikshayBlock) — not just whichever TU happened to land
        // first in the multi-select array, which was order-dependent and
        // didn't necessarily match what "Select Block" showed on screen.
        // Falls back to the first selected TU only when Block was never
        // touched (e.g. admin picked TUs solely via "Select TU"). The full
        // multi-TU list lives in NikshayTUID/NikshayTUName, not here.
        blockID:
          this.selectedNikshayBlock?.nikshayTUID ??
          (tuIDArrTB.length ? tuIDArrTB[0] : null),
        blockName:
          this.selectedNikshayBlock?.tUName ??
          (tuNameArrTB.length ? tuNameArrTB[0] : null),
        nikshayTUID: tuIDArrTB.length ? tuIDArrTB.join(',') : null,
        nikshayTUName: tuNameArrTB.length ? tuNameArrTB.join(', ') : null,
        nikshayFacilityID: facilityIDArrTB.length
          ? facilityIDArrTB.join(',')
          : null,
        nikshayFacilityName: facilityNameArrTB.length
          ? facilityNameArrTB.join(', ')
          : null,
        // Villageid takes the Nikshay Village picker's selection directly,
        // same as the Edit path (see updateGroupedWorkLocation). This
        // column holds AMRIT village IDs everywhere else in the system,
        // including the mobile app's own beneficiary worklist match
        // (BenFlowStatus.villageID) — writing Nikshay village IDs here
        // means that match won't resolve for these villages until a
        // Nikshay-village-to-AMRIT-village bridge table exists to
        // translate between the two numbering systems. Previously this was
        // left null specifically on Create to avoid that collision, but
        // Edit was already writing it the same way — silently dropping the
        // admin's village selection on every new Stop TB worker until they
        // were separately edited was a worse outcome than the collision
        // risk both paths already carry identically.
        villageID: villageIDArrTB.length ? villageIDArrTB : null,
        villageName: villageNameArrTB.length ? villageNameArrTB : null,
        Inbound: 'N/A',
        Outbound: 'N/A',
        teleConsultation: [null],
      };
      this.bufferArray.data.push(stopTBWorkLocationObj);
      if (this.paginatorSecond) {
        this.bufferArray.paginator = this.paginatorSecond;
      }
      if (this.sortSecond) {
        this.bufferArray.sort = this.sortSecond;
      }
      this.rebuildGroupedBuffer();
      return;
    }

    const villageIDArr: any = [];
    const villageNameArr: any = [];
    if (this.isFacilityServiceline) {
      const fmVillageIDs = this.currentFacilityMappingData?.villageIDs || [];
      const fmVillageNames =
        this.currentFacilityMappingData?.villageNames || [];
      villageIDArr.push(...fmVillageIDs);
      villageNameArr.push(...fmVillageNames);
    } else if (
      objectToBeAdded.Serviceblock !== undefined &&
      objectToBeAdded.Servicevillage
    ) {
      objectToBeAdded.Servicevillage.filter((item: any) => {
        villageNameArr.push(item.villageName);
        villageIDArr.push(item.districtBranchID);
      });
    }
    const roleArr = [];
    roleArr.push(obj);
    const allRolesArr = [];
    for (let i = 0; i < roleArr.length; i++) {
      allRolesArr.push(roleArr[i].teleConsultation);
    }
    // For ASHA Supervisor with multiple facilities, create one row per facility
    const facilityIDs = this.currentFacilityMappingData?.facilityIDs || [];
    const singleFacilityID =
      this.currentFacilityMappingData?.facilityID || null;
    const facilityList =
      this.currentFacilityMappingData?.isAshaSupervisor &&
      facilityIDs.length > 0
        ? facilityIDs
        : [singleFacilityID];

    for (const fID of facilityList) {
      const workLocationObj: any = {
        previleges: [],
        userID: objectToBeAdded.user.userID,
        userName: objectToBeAdded.user.userName,
        serviceID: objectToBeAdded.serviceline.serviceID,
        serviceName: objectToBeAdded.serviceline.serviceName,
        blockName:
          objectToBeAdded.Serviceblock !== undefined &&
          objectToBeAdded.Serviceblock.blockName !== undefined &&
          objectToBeAdded.Serviceblock.blockName !== '' &&
          objectToBeAdded.Serviceblock.blockName !== null
            ? objectToBeAdded.Serviceblock.blockName
            : null,
        blockID:
          objectToBeAdded.Serviceblock !== undefined &&
          objectToBeAdded.Serviceblock.blockID !== undefined &&
          objectToBeAdded.Serviceblock.blockID !== null
            ? objectToBeAdded.Serviceblock.blockID
            : null,
        workingLocation: objectToBeAdded.worklocation?.locationName || null,
        roleID1: roleArr,
        villageName:
          villageNameArr !== undefined && villageNameArr.length > 0
            ? villageNameArr
            : null,
        villageID:
          villageIDArr !== undefined && villageIDArr.length > 0
            ? villageIDArr
            : null,
        Inbound:
          objectToBeAdded.serviceline.serviceName === '1097'
            ? InboundValue
            : 'N/A',
        Outbound:
          objectToBeAdded.serviceline.serviceName === '1097'
            ? OnboundValue
            : 'N/A',
        providerServiceMapID:
          objectToBeAdded.serviceline.isNational === false
            ? objectToBeAdded.state.providerServiceMapID
            : this.states_array[0].providerServiceMapID,
        createdBy: this.createdBy,
        workingLocationID: objectToBeAdded.worklocation?.pSAddMapID || null,
        stateID: objectToBeAdded.state?.stateID || null,
        districtID: objectToBeAdded.district?.districtID || null,
        teleConsultation: allRolesArr,
        facilityID: fID,
      };
      if (objectToBeAdded.state) {
        workLocationObj['stateName'] = objectToBeAdded.state.stateName;
      } else {
        workLocationObj['stateName'] = 'All States';
      }
      if (objectToBeAdded.district !== undefined) {
        workLocationObj['district'] = objectToBeAdded.district.districtName;
      } else {
        workLocationObj['district'] = null;
      }
      this.bufferArray.data.push(workLocationObj);
    }
    if (this.paginatorSecond) {
      this.bufferArray.paginator = this.paginatorSecond;
    }
    if (this.sortSecond) {
      this.bufferArray.sort = this.sortSecond;
    }
    this.rebuildGroupedBuffer();
  }

  resetAllArrays() {
    this.states_array = [];

    this.districts_array = [];

    this.workLocationsList = [];

    this.availableRoles = [];

    this.RolesList = [];

    this.showInOutBound = false;

    this.teleConsultationFlag = false;
    this.teleConsultation = null;
  }

  deleteRow(i: any, serviceID: any, providerServiceMapID: any, userID: any) {
    this.bufferArray.data.splice(i, 1);
    if (this.paginatorSecond) {
      this.bufferArray.paginator = this.paginatorSecond;
    }
    if (this.sortSecond) {
      this.bufferArray.sort = this.sortSecond;
    }
    this.rebuildGroupedBuffer();
    this.getAllRoles(serviceID, providerServiceMapID, userID);
    this.availableRoles = [];
    this.RolesList = [];
  }

  removeRole(rowIndex: any, roleIndex: any) {
    this.bufferArray.data[rowIndex].roleID1.splice(roleIndex, 1);
    if (this.paginatorSecond) {
      this.bufferArray.paginator = this.paginatorSecond;
    }
    if (this.sortSecond) {
      this.bufferArray.sort = this.sortSecond;
    }
    this.getAllRoles(
      this.bufferArray.data[rowIndex].serviceID,
      this.bufferArray.data[rowIndex].providerServiceMapID,
      this.bufferArray.data[rowIndex].userID,
    );
    if (this.bufferArray.data[rowIndex].roleID1.length === 0) {
      this.bufferArray.data.splice(rowIndex, 1);
      this.bufferArray.paginator = this.paginatorSecond;
    }
  }

  saveWorkLocations() {
    console.log(this.bufferArray, 'Request Object');
    const requestArray = [];
    const workLocationObj = {
      previleges: [
        {
          ID: [
            {
              roleID: '',
              teleConsultation: '',
              inbound: '',
              outbound: '',
            },
          ],
          providerServiceMapID: '',
          workingLocationID: '',
          blockID: '',
          blockName: '',
        },
      ],
      userID: '',
      createdBy: '',
      serviceProviderID: this.serviceProviderID,
    };

    for (let i = 0; i < this.bufferArray.data.length; i++) {
      const allRoleArr = [];
      if (this.Role) {
        this.Role.filter((item: any) => {
          allRoleArr.push(item.roleName);
        });
      }
      const workLocationObj = {
        previleges: [
          {
            ID: [
              {
                roleID: this.bufferArray.data[i].roleID1[0].roleID1,

                teleConsultation: this.bufferArray.data[i].teleConsultation[0],

                inbound:
                  this.bufferArray.data[i].serviceName === '1097'
                    ? this.bufferArray.data[i].Inbound
                    : null,

                outbound:
                  this.bufferArray.data[i].serviceName === '1097'
                    ? this.bufferArray.data[i].Outbound
                    : null,
              },
            ],

            providerServiceMapID: this.bufferArray.data[i].providerServiceMapID,

            workingLocationID: this.bufferArray.data[i].workingLocationID,

            stateID: this.bufferArray.data[i].stateID,

            districtID: this.bufferArray.data[i].districtID,

            blockID: this.bufferArray.data[i].blockID,

            blockName: this.bufferArray.data[i].blockName,

            villageID: this.bufferArray.data[i].villageID,

            villageName: this.bufferArray.data[i].villageName,

            facilityID: this.bufferArray.data[i].facilityID,

            nikshayTUID: this.bufferArray.data[i].nikshayTUID || null,

            nikshayFacilityID:
              this.bufferArray.data[i].nikshayFacilityID || null,
          },
        ],

        userID: this.bufferArray.data[i].userID,

        createdBy: this.createdBy,

        serviceProviderID: this.serviceProviderID,
      };

      requestArray.push(workLocationObj);
    }

    const supervisorUserID =
      requestArray.length > 0 ? requestArray[0].userID : null;

    // ASHA Supervisor: save ASHA mapping FIRST, then work location
    if (
      this.currentFacilityMappingData?.isAshaSupervisor &&
      this.currentFacilityMappingData?.ashaSupervisorMappings?.length > 0
    ) {
      this.saveAshaSupervisorMappingsThenWorkLocation(
        requestArray,
        supervisorUserID,
      );
    } else {
      // Non-ASHA: save work location directly
      this.saveWorkLocationOnly(requestArray);
    }
  }

  saveAshaSupervisorMappingsThenWorkLocation(
    requestArray: any,
    supervisorUserID: any,
  ) {
    const mappings = this.currentFacilityMappingData.ashaSupervisorMappings.map(
      (m: any) => ({
        supervisorUserID: supervisorUserID,
        ashaUserID: m.ashaUserID,
        facilityID: m.facilityID,
        createdBy: this.createdBy,
      }),
    );

    // Collect facilityIDs for potential rollback
    const facilityIDs: number[] = Array.from(
      new Set<number>(mappings.map((m: any) => m.facilityID)),
    );

    // Step 1: Save ASHA supervisor mapping first
    this.facilityMasterService
      .saveAshaSupervisorMapping(mappings)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        () => {
          // Step 2: ASHA mapping saved — now save work location
          this.worklocationmapping
            .SaveWorkLocationMapping(requestArray)
            .pipe(takeUntil(this.destroy$))
            .subscribe(
              () => {
                this.alertService.alert(
                  'Mapping saved successfully',
                  'success',
                );
                this.cleanupAfterSave();
              },
              (err: any) => {
                // Work location failed — rollback ASHA mapping
                this.rollbackAshaSupervisorMapping(
                  supervisorUserID,
                  facilityIDs,
                );
              },
            );
        },
        (err: any) => {
          // ASHA mapping failed — don't save work location at all
          this.alertService.alert(
            'Failed to save ASHA supervisor mapping. Work location not saved.',
            'error',
          );
        },
      );
  }

  saveWorkLocationOnly(requestArray: any) {
    this.worklocationmapping
      .SaveWorkLocationMapping(requestArray)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        () => {
          this.alertService.alert('Mapping saved successfully', 'success');
          this.cleanupAfterSave();
        },
        (err: any) => {
          this.alertService.alert(
            'Failed to save work location mapping',
            'error',
          );
        },
      );
  }

  cleanupAfterSave() {
    this.getAllMappedWorkLocations();
    this.eForm.resetForm();
    this.showTable();
    this.resetAllArrays();
    this.disableSelectRoles = false;
    this.filteredStates = [];
    this.bufferArray.data = [];
    this.bufferArray.paginator = this.paginatorSecond;
    this.currentFacilityMappingData = null;
  }

  /**
   * ASHA Supervisor edit: fetch old mappings, delete them, save new ones, then call onSuccess.
   * Old mappings are stored so they can be restored on rollback.
   */
  updateAshaSupervisorMappings(
    facilityIDs: any[],
    onSuccess: (oldMappings: any[]) => void,
  ) {
    // Fix 7: single atomic call — delete old + save new in one backend transaction
    // No more gap between delete and save where a timeout could wipe all mappings
    const newMappings = (
      this.editFacilityMappingData?.ashaSupervisorMappings || []
    ).map((m: any) => ({
      supervisorUserID: this.userID_duringEdit,
      ashaUserID: m.ashaUserID,
      facilityID: m.facilityID,
      createdBy: this.createdBy,
    }));

    this.facilityMasterService
      .updateAshaSupervisorMappingAtomically(
        this.userID_duringEdit,
        facilityIDs,
        newMappings,
        this.createdBy,
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        () => {
          onSuccess([]);
        },
        (err: any) => {
          this.alertService.alert(
            'Failed to update ASHA supervisor mapping. Work location not updated.',
            'error',
          );
        },
      );
  }

  /**
   * Rollback for edit flow: delete new ASHA mappings, then re-save old ones.
   */
  rollbackAshaSupervisorMappingWithRestore(
    supervisorUserID: any,
    facilityIDs: number[],
    oldMappings: any[],
  ) {
    this.facilityMasterService
      .deleteAshaSupervisorMapping(supervisorUserID, facilityIDs)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        () => {
          // Re-save old mappings to restore original state
          this.restoreOldAshaMappings(oldMappings);
        },
        () => {
          this.alertService.alert(
            'Work location failed. ASHA rollback also failed — contact admin.',
            'error',
          );
          this.showTable();
          this.getAllMappedWorkLocations();
        },
      );
  }

  /**
   * Rollback for create flow: just delete the newly saved ASHA mappings.
   */
  rollbackAshaSupervisorMapping(supervisorUserID: any, facilityIDs: number[]) {
    this.facilityMasterService
      .deleteAshaSupervisorMapping(supervisorUserID, facilityIDs)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        () => {
          this.alertService.alert(
            'Work location save failed. ASHA mapping rolled back.',
            'error',
          );
          this.showTable();
          this.getAllMappedWorkLocations();
        },
        () => {
          this.alertService.alert(
            'Work location save failed. ASHA rollback also failed — contact admin.',
            'error',
          );
          this.showTable();
          this.getAllMappedWorkLocations();
        },
      );
  }

  /**
   * Restore soft-deleted ASHA supervisor mappings by setting deleted=false on original rows.
   */
  private restoreOldAshaMappings(oldMappings: any[]) {
    if (!oldMappings || oldMappings.length === 0) {
      this.alertService.alert(
        'ASHA mapping update failed. Work location not updated.',
        'error',
      );
      this.showTable();
      this.getAllMappedWorkLocations();
      return;
    }

    const ids = oldMappings.map((m: any) => m.id);

    this.facilityMasterService
      .restoreAshaSupervisorMapping(ids)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        () => {
          this.alertService.alert(
            'ASHA mapping update failed. Original mappings restored. Work location not updated.',
            'error',
          );
          this.showTable();
          this.getAllMappedWorkLocations();
        },
        () => {
          this.alertService.alert(
            'ASHA mapping update failed. Restore also failed — contact admin.',
            'error',
          );
          this.showTable();
          this.getAllMappedWorkLocations();
        },
      );
  }

  //################### EDIT SECTION ##########################

  userID_duringEdit: any;

  stateID_duringEdit: any;

  providerServiceMapID_duringEdit: any;

  district_duringEdit: any;

  workLocationID_duringEdit: any;

  roleID_duringEdit: any;

  serviceID_duringEdit: any;

  isInboundEdit = false;

  isOutboundEdit = false;

  isNational_edit = false;

  set_currentPSM_ID_duringEdit(psmID: any) {
    this.providerServiceMapID_duringEdit = psmID;
  }

  editRow(rowObject: any) {
    this.showEditForm();

    this.edit = true;

    this.disableUsername = true;

    this.edit_Details = rowObject;

    this.userID_duringEdit = rowObject.userID;

    console.log('TO BE EDITED REQ OBJ', this.edit_Details);

    this.uSRMappingID = rowObject.uSRMappingID;

    const parsedWLID2 = parseInt(this.edit_Details.workingLocationID, 10);
    this.workLocationID_duringEdit = isNaN(parsedWLID2) ? null : parsedWLID2;

    this.userID_duringEdit = this.edit_Details.userID;

    this.stateID_duringEdit = this.edit_Details.stateID;

    this.providerServiceMapID_duringEdit =
      this.edit_Details.providerServiceMapID;

    this.district_duringEdit = parseInt(
      this.edit_Details.workingDistrictID,
      10,
    );

    this.roleID_duringEdit = this.edit_Details.roleID;

    this.serviceID_duringEdit = this.edit_Details.serviceID;

    this.isInboundEdit = this.edit_Details.inbound;

    this.isOutboundEdit = this.edit_Details.outbound;

    if (
      this.edit_Details.serviceName === '1097' &&
      !(this.edit_Details.roleName.toLowerCase() === 'supervisor')
    ) {
      this.showInOutBoundEdit = true;
    } else if (
      this.edit_Details.serviceName === 'HWC' &&
      (this.edit_Details.roleName.toLowerCase() === 'nurse' ||
        this.edit_Details.roleName.toLowerCase() === 'doctor') &&
      this.edit_Details.teleConsultation
    ) {
      this.teleConsultationEditFlag = true;
      this.teleConsultationEdit = this.edit_Details.teleConsultation;
    } else {
      this.showInOutBoundEdit = false;
      this.teleConsultationEdit = null;
      this.teleConsultationEditFlag = false;
    }

    // Set facility serviceline flag for edit mode
    this.isFacilityServicelineEdit =
      this.edit_Details.serviceName === 'FLW' ||
      this.edit_Details.serviceName === 'HWC';
    this.isBlockRequiredEdit = this.edit_Details.serviceName === 'Stop TB';
    this.isStopTBServicelineEdit = this.edit_Details.serviceName === 'Stop TB';

    if (this.isStopTBServicelineEdit) {
      this.loadNikshayEditSelections();
    } else {
      this.resetNikshaySelection();
    }

    if (this.isFacilityServicelineEdit) {
      this.editExistingVillageIDs = Array.isArray(this.edit_Details.villageID)
        ? this.edit_Details.villageID.slice()
        : [];
      this.editExistingVillageNames = Array.isArray(
        this.edit_Details.villageName,
      )
        ? this.edit_Details.villageName.slice()
        : [];
      this.editServiceName = this.edit_Details.serviceName || '';
      this.editRoleName = this.edit_Details.roleName || '';
      this.editSupervisorUserID = this.edit_Details.userID;
      this.editExistingFacilityID = null;
      this.editExistingFacilityIDs = [];
      this.editExistingFacilityNames = [];
      this.editAshaMappingPairs = [];
      this.editFacilityMappingData = null;
      this.editIsAshaSupervisor =
        (this.edit_Details.roleName || '').toLowerCase() === 'asha supervisor';

      if (this.editIsAshaSupervisor) {
        // ASHA Supervisor: find ALL rows for same user in table data
        const userRows = this.mappedWorkLocationsList.filter(
          (row: any) =>
            row.userID === this.edit_Details.userID &&
            row.providerServiceMapID ===
              this.edit_Details.providerServiceMapID &&
            row.roleName === this.edit_Details.roleName,
        );
        const mappingIDs = userRows
          .map((row: any) => row.uSRMappingID)
          .filter((id: any) => !!id);

        if (mappingIDs.length > 0) {
          // Fetch facility details for ALL rows in parallel
          const requests = mappingIDs.map((id: any) =>
            this.facilityMasterService.getFacilityByMappingID(id),
          );
          forkJoin(requests)
            .pipe(takeUntil(this.destroy$))
            .subscribe(
              (results: any) => {
                const facilityIDs: any[] = [];
                const facilityNames: string[] = [];
                const pairs: { uSRMappingID: any; facilityID: any }[] = [];
                let firstFacilityTypeID: any = null;
                let firstRuralUrban = '';
                for (let i = 0; i < results.length; i++) {
                  const res = results[i];
                  const data =
                    res && res.data
                      ? typeof res.data === 'string'
                        ? JSON.parse(res.data)
                        : res.data
                      : {};
                  const hasFacility =
                    data.facilityID != null && data.facilityID !== 0;

                  // Always track the mapping pair (needed to soft-delete rows for deleted facilities)
                  pairs.push({
                    uSRMappingID: mappingIDs[i],
                    facilityID: hasFacility ? data.facilityID : null,
                  });

                  // Only add to display lists if facility is active (not deleted)
                  if (hasFacility) {
                    facilityIDs.push(data.facilityID);
                    facilityNames.push(
                      data.facilityName || 'Facility ID ' + data.facilityID,
                    );
                    if (!firstFacilityTypeID) {
                      firstFacilityTypeID = data.facilityTypeID;
                      firstRuralUrban = data.ruralUrban || '';
                    }
                  }
                }
                this.editExistingFacilityIDs = facilityIDs;
                this.editExistingFacilityNames = facilityNames;
                this.editAshaMappingPairs = pairs;
                // Use first facility's details for dropdown pre-population
                this.editExistingFacilityID =
                  facilityIDs.length > 0 ? facilityIDs[0] : null;
                this.editExistingFacilityName =
                  facilityNames.length > 0 ? facilityNames[0] : '';
                this.editExistingFacilityTypeID = firstFacilityTypeID;
                this.editExistingRuralUrban = firstRuralUrban;
              },
              (err: any) => {
                this.alertService.alert(
                  'Failed to load facility details for edit',
                  'error',
                );
              },
            );
        }
      } else {
        // FLW/HWC (non-ASHA Supervisor): single facility
        if (this.edit_Details.uSRMappingID) {
          this.facilityMasterService
            .getFacilityByMappingID(this.edit_Details.uSRMappingID)
            .pipe(takeUntil(this.destroy$))
            .subscribe(
              (res: any) => {
                if (res && res.data) {
                  const data =
                    typeof res.data === 'string'
                      ? JSON.parse(res.data)
                      : res.data;
                  this.editExistingFacilityID =
                    data.facilityID != null && data.facilityID !== 0
                      ? data.facilityID
                      : null;
                  this.editExistingFacilityName = data.facilityName || '';
                  this.editExistingFacilityTypeID =
                    data.facilityTypeID != null && data.facilityTypeID !== 0
                      ? data.facilityTypeID
                      : null;
                  this.editExistingRuralUrban = data.ruralUrban || '';
                }
              },
              (err: any) => {
                this.alertService.alert(
                  'Failed to load facility details for edit',
                  'error',
                );
              },
            );
        }
      }
    } else {
      this.editExistingVillageIDs = [];
      this.editExistingVillageNames = [];
      this.editExistingFacilityID = null;
      this.editExistingFacilityIDs = [];
      this.editExistingFacilityNames = [];
      this.editAshaMappingPairs = [];
      this.editFacilityMappingData = null;
      this.editIsAshaSupervisor = false;
    }

    this.getProviderServices(this.userID);

    this.checkService_forIsNational();

    this.getProviderStates_duringPatchEdit(
      this.serviceID_duringEdit,
      this.isNational_edit,
    );

    if (this.edit_Details.stateID === undefined) {
      this.set_currentPSM_ID_duringEdit(this.edit_Details.providerServiceMapID);

      this.stateID_duringEdit = '';

      this.district_duringEdit = null;

      // HWC/FLW: no workingLocationID — load roles directly
      if (this.isFacilityServicelineEdit) {
        this.getAllRoles_duringEdit2(
          this.serviceID_duringEdit,
          this.providerServiceMapID_duringEdit,
          this.userID_duringEdit,
        );
      } else {
        this.getAllWorkLocations_duringEdit2(
          this.states_array[0].stateID,
          this.serviceID_duringEdit,
          this.isNational_edit,
          this.district_duringEdit,
          this.providerServiceMapID_duringEdit,
          this.userID_duringEdit,
        );
      }
    } else {
      this.getAllDistricts_duringEdit2(
        this.edit_Details.stateID,
        this.stateID_duringEdit,
        this.serviceID_duringEdit,
        this.isNational_edit,
        this.district_duringEdit,
        this.providerServiceMapID_duringEdit,
        this.userID_duringEdit,
      );
    }
  }

  getAllDistricts_duringEdit2(
    state: any,
    stateID: any,
    serviceID: any,
    isNational_edit: any,
    districtID: any,
    psmID: any,
    userID: any,
  ) {
    this.worklocationmapping
      .getAllDistricts(state)

      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (response: any) => {
          if (response) {
            console.log(response, 'get all districts success handeler');

            this.districts_array = response.data;

            // HWC/FLW: no workingLocationID — load roles directly
            if (this.isFacilityServicelineEdit) {
              this.getAllRoles_duringEdit2(serviceID, psmID, userID);
            } else {
              this.getAllWorkLocations_duringEdit2(
                stateID,
                serviceID,
                isNational_edit,
                districtID,
                psmID,
                userID,
              );
            }
          }
        },
        (err: any) => {
          this.alertService.alert('Failed to load districts', 'error');
        },
      );
  }

  getAllWorkLocations_duringEdit2(
    stateID: any,
    serviceID: any,
    isNational_edit: any,
    districtID: any,
    psmID: any,
    userID: any,
  ) {
    this.worklocationmapping
      .getAllWorkLocations(
        this.serviceProviderID,
        stateID,
        serviceID,
        isNational_edit,
        districtID,
      )

      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (response: any) => {
          if (response) {
            console.log(
              response,
              'get all work locations success handeler edit',
            );

            this.workLocationsList = response.data;
          }
          // Always load roles — even when workLocationsList is empty (null workingLocationID)
          this.getAllRoles_duringEdit2(serviceID, psmID, userID);
        },
        (err: any) => {
          // Even if work locations API fails, still load roles so edit form works
          this.getAllRoles_duringEdit2(serviceID, psmID, userID);
        },
      );
  }

  getAllRoles_duringEdit2(serviceID: any, psmID: any, userID: any) {
    this.worklocationmapping
      .getAllRoles(psmID)

      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (response: any) => {
          if (response) {
            console.log(response, 'get all roles success handeler');

            this.RolesList = response.data;

            this.checkExistance(serviceID, psmID, userID);
          }

          if (this.editGroupedElement) {
            const groupRoleIDs = this.editGroupedElement.roles
              .filter((r) => !r.userServciceRoleDeleted)
              .map((r) => r.roleID);
            for (const rid of groupRoleIDs) {
              const existingRole = this.RolesList.find(
                (r: any) => r.roleID === rid,
              );
              if (
                existingRole &&
                !this.availableRoles.some(
                  (ar: any) => ar.roleID === existingRole.roleID,
                )
              ) {
                this.availableRoles.push(existingRole);
              }
            }
          } else if (this.edit_Details !== undefined) {
            if (this.RolesList) {
              const edit_role = this.RolesList.filter((mappedRole: any) => {
                if (this.edit_Details.roleID === mappedRole.roleID) {
                  return mappedRole;
                }
              })[0];

              if (edit_role) {
                this.availableRoles.push(edit_role);
              }
            }
          }
        },
        (err: any) => {
          this.alertService.alert('Failed to load roles', 'error');
        },
      );
  }

  checkService_forIsNational() {
    for (let i = 0; i < this.services_array.length; i++) {
      if (
        this.serviceID_duringEdit === this.services_array[i].serviceID &&
        this.services_array[i].isNational
      ) {
        this.isNational_edit = this.services_array[i].isNational;

        break;
      } else {
        this.isNational_edit = false;
      }
    }
  }

  setIsNational_edit(value: any) {
    this.isNational_edit = value;
  }

  getProviderServices_edit(userID: any) {
    this.worklocationmapping
      .getServices(this.userID)

      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (response: any) => this.getServicesSuccessHandeler(response.data),
        (err: any) => {
          this.alertService.alert('Failed to load services', 'error');
        },
      );
  }

  getServicesSuccessHandeler(response: any) {
    if (response) {
      console.log('Provider Services in State', response);

      this.services_array = response.data;
    }
  }

  getProviderStates_duringEdit(serviceID: any, isNational: any) {
    this.worklocationmapping
      .getStates(this.userID, serviceID, isNational)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (response: any) =>
          this.getStatesSuccessHandeler_duringEdit(
            serviceID,
            response.data,
            isNational,
            true,
          ),
        (err: any) => {
          this.alertService.alert('Failed to load states', 'error');
        },
      );
  }

  getProviderStates_duringPatchEdit(serviceID: any, isNational: any) {
    this.worklocationmapping
      .getStates(this.userID, serviceID, isNational)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (response: any) =>
          this.getStatesSuccessHandeler_duringEdit(
            serviceID,
            response.data,
            isNational,
            false,
          ),
        (err: any) => {
          this.alertService.alert('Failed to load states', 'error');
        },
      );
  }

  getStatesSuccessHandeler_duringEdit(
    serviceID: any,
    response: any,
    isNational: any,
    blockVillageCheckFlag: any,
  ) {
    if (response) {
      console.log(response, 'Provider States');

      this.states_array = response;

      this.districts_array = [];

      this.workLocationsList = [];

      this.RolesList = [];

      this.availableRoles = [];

      if (isNational) {
        this.set_currentPSM_ID_duringEdit(
          this.states_array[0].providerServiceMapID,
        );

        this.stateID_duringEdit = '';

        this.district_duringEdit = null;

        this.getAllWorkLocations_duringEdit(
          this.states_array[0].stateID,
          this.serviceID_duringEdit,
          this.isNational_edit,
          this.district_duringEdit,
        );

        this.getAllRoles_duringEdit(
          serviceID,
          this.providerServiceMapID_duringEdit,
          this.userID_duringEdit,
        );
      }

      if (blockVillageCheckFlag === true) {
        this.getAllDistricts_duringEdit(this.stateID_duringEdit);
      } else {
        this.getAllDistricts_duringPatchEdit(this.stateID_duringEdit);
      }
    }
  }

  refresh1() {
    this.district_duringEdit = undefined;

    // HWC/FLW: workLocationID is not dependent — preserve DB value
    if (!this.isFacilityServicelineEdit) {
      this.workLocationID_duringEdit = undefined;
    }
    this.roleID_duringEdit = undefined;
  }

  refresh2() {
    this.refresh3();
  }

  refresh3() {
    this.district_duringEdit = undefined;

    // HWC/FLW: workLocationID is not dependent — preserve DB value
    if (!this.isFacilityServicelineEdit) {
      this.workLocationID_duringEdit = undefined;
    }

    this.roleID_duringEdit = undefined;

    this.teleConsultationEditFlag = false;
  }

  refresh5() {
    // HWC/FLW: workLocationID is not dependent — preserve DB value
    if (!this.isFacilityServicelineEdit) {
      this.workLocationID_duringEdit = undefined;
    }

    this.roleID_duringEdit = undefined;
  }

  refresh4() {
    this.roleID_duringEdit = undefined;
  }

  getAllDistricts_duringEdit(state: any) {
    this.worklocationmapping
      .getAllDistricts(state)

      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (response: any) => {
          if (response) {
            console.log(response, 'get all districts success handeler');

            this.districts_array = response.data;
          }
        },
        (err: any) => {
          this.alertService.alert('Failed to load districts', 'error');
        },
      );
  }

  getAllDistricts_duringPatchEdit(state: any) {
    this.worklocationmapping
      .getAllDistricts(state)

      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (response: any) => {
          if (response) {
            console.log(response, 'get all districts success handeler');

            this.districts_array = response.data;

            this.district_duringEdit = parseInt(
              this.edit_Details.workingDistrictID,
              10,
            );

            if (
              !isNaN(this.district_duringEdit) &&
              this.district_duringEdit &&
              (this.edit_Details.serviceName === 'FLW' ||
                this.edit_Details.serviceName === 'HWC' ||
                this.edit_Details.serviceName === 'TM' ||
                this.edit_Details.serviceName === 'MMU' ||
                this.edit_Details.serviceName === 'Stop TB')
            ) {
              this.getEditBlockPatchMaster(this.district_duringEdit);
            }
          }
        },
        (err: any) => {
          this.alertService.alert('Failed to load districts', 'error');
        },
      );
  }

  getAllWorkLocations_duringEdit(
    stateID: any,
    serviceID: any,
    isNational_edit: any,
    districtID: any,
  ) {
    // HWC/FLW: no workingLocationID dependency — skip API call
    if (this.isFacilityServicelineEdit) {
      return;
    }
    this.worklocationmapping
      .getAllWorkLocations(
        this.serviceProviderID,
        stateID,
        serviceID,
        isNational_edit,
        districtID,
      )

      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (response: any) => {
          if (response) {
            console.log(
              response,
              'get all work locations success handeler edit',
            );

            this.workLocationsList = response.data;
          }
        },
        (err: any) => {
          this.alertService.alert('Failed to load work locations', 'error');
        },
      );
  }

  getAllRoles_duringEdit(serviceID: any, psmID: any, userID: any) {
    this.worklocationmapping
      .getAllRoles(psmID)

      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (response: any) => {
          if (response) {
            console.log(response, 'get all roles success handeler');

            this.RolesList = response.data;

            this.checkExistance(serviceID, psmID, userID);
          }

          //on edit - populate roles

          if (this.editGroupedElement) {
            const groupRoleIDs = this.editGroupedElement.roles
              .filter((r) => !r.userServciceRoleDeleted)
              .map((r) => r.roleID);
            for (const rid of groupRoleIDs) {
              const existingRole = this.RolesList.find(
                (r: any) => r.roleID === rid,
              );
              if (
                existingRole &&
                !this.availableRoles.some(
                  (ar: any) => ar.roleID === existingRole.roleID,
                )
              ) {
                this.availableRoles.push(existingRole);
              }
            }
          } else if (this.edit_Details !== undefined) {
            if (this.RolesList) {
              const edit_role = this.RolesList.filter((mappedRole: any) => {
                if (this.edit_Details.roleID === mappedRole.roleID) {
                  return mappedRole;
                }
              })[0];

              if (edit_role) {
                this.availableRoles.push(edit_role);
              }
            }
          }
        },
        (err: any) => {
          this.alertService.alert('Failed to load roles', 'error');
        },
      );
  }

  updateWorkLocation(workLocations: any) {
    // Fix 15: warn if district or block changed
    if (!this._fix15WarnConfirmed) {
      const origDistrict = parseInt(this.edit_Details?.workingDistrictID, 10);
      const origBlock = this.edit_Details?.blockID;
      const districtChanged =
        !isNaN(origDistrict) &&
        this.district_duringEdit != null &&
        this.district_duringEdit !== origDistrict;
      const blockChanged =
        origBlock != null &&
        this.ServiceEditblock != null &&
        this.ServiceEditblock !== origBlock;
      if (districtChanged || blockChanged) {
        this.alertService
          .confirm(
            'Warning',
            'Changing the district or block will invalidate existing village mappings and ASHA supervisor assignments. Are you sure you want to continue?',
          )
          .subscribe((confirmed: any) => {
            if (confirmed) {
              this._fix15WarnConfirmed = true;
              this.updateWorkLocation(workLocations);
              this._fix15WarnConfirmed = false;
            }
          });
        return;
      }
    }
    this._fix15WarnConfirmed = false;
    const duplicate: boolean =
      this.checkHWCDuplicateMainArrayForEditScreen(workLocations);
    if (workLocations.serviceID === 1) {
      const updateRoleName = this.RolesList.filter((response: any) => {
        if (workLocations.role === response.roleID) {
          return response;
        }
      })[0];

      if (
        (this.isInboundEdit === false ||
          this.isInboundEdit === null ||
          this.isInboundEdit === undefined) &&
        (this.isOutboundEdit === false ||
          this.isOutboundEdit === null ||
          this.isOutboundEdit === undefined) &&
        !(updateRoleName.roleName.toLowerCase() === 'supervisor')
      ) {
        this.alertService.alert('Select checkbox Inbound/Outbound/Both');
      } else {
        this.updateData(workLocations, updateRoleName.roleName);
      }
    } else if (workLocations.serviceID === 9 && duplicate === true) {
      this.alertService.alert('Same User already Mapped with different State');
    } else {
      const editVillageIdArray: any = [];
      const editVillageNameArray: any = [];

      if (this.isFacilityServicelineEdit && this.editFacilityMappingData) {
        editVillageIdArray.push(
          ...(this.editFacilityMappingData.villageIDs || []),
        );
        editVillageNameArray.push(
          ...(this.editFacilityMappingData.villageNames || []),
        );
      } else if (
        this.serviceEditvillage !== undefined &&
        this.serviceEditvillage !== null &&
        this.serviceEditvillage.length > 0
      ) {
        this.serviceEditvillage.filter((item: any) => {
          this.editVillageArr.filter((itemValue: any) => {
            if (item === itemValue.villageName) {
              editVillageIdArray.push(itemValue.districtBranchID);
              editVillageNameArray.push(itemValue.villageName);
            }
          });
        });
      }

      // Detect if admin changed role away from ASHA Supervisor
      const newRoleName = (
        (this.RolesList.find((r: any) => r.roleID === workLocations.role) || {})
          .roleName || ''
      ).toLowerCase();
      const isStillAshaSupervisor = newRoleName === 'asha supervisor';

      console.log(
        '[DEBUG SAVE] editIsAshaSupervisor:',
        this.editIsAshaSupervisor,
        'editAshaMappingPairs.length:',
        this.editAshaMappingPairs.length,
        'isStillAshaSupervisor:',
        isStillAshaSupervisor,
        'editFacilityMappingData:',
        JSON.stringify(this.editFacilityMappingData),
      );

      // Role changed from ASHA Supervisor → another role: keep 1 row, delete extras, clear ASHA mappings
      if (
        this.editIsAshaSupervisor &&
        this.editAshaMappingPairs.length > 0 &&
        !isStillAshaSupervisor
      ) {
        const oldPairs = this.editAshaMappingPairs;
        const allOldFacilityIDs = oldPairs.map((p: any) => p.facilityID);
        // Use the single facility the admin selected, fall back to first old facility
        const chosenFacilityID =
          this.editFacilityMappingData?.facilityID || oldPairs[0].facilityID;

        // Step 1: Delete all ASHA supervisor mappings (no re-save)
        this.facilityMasterService
          .deleteAshaSupervisorMapping(
            this.userID_duringEdit,
            allOldFacilityIDs,
          )
          .pipe(takeUntil(this.destroy$))
          .subscribe(
            () => {
              // Step 2: Update first USR row with new role + chosen facility
              const primaryLangObj: any = {
                uSRMappingID: oldPairs[0].uSRMappingID,
                userID: this.userID_duringEdit,
                roleID: workLocations.role,
                teleConsultation: this.teleConsultationEdit,
                providerServiceMapID: this.providerServiceMapID_duringEdit,
                blockID: this.ServiceEditblock,
                blockName: this.blockname,
                villageID: editVillageIdArray,
                villageName:
                  editVillageNameArray.length > 0 ? editVillageNameArray : null,
                workingLocationID: this.isFacilityServicelineEdit
                  ? null
                  : this.workLocationID_duringEdit,
                stateID: this.stateID_duringEdit,
                districtID: this.district_duringEdit,
                modifiedBy: this.createdBy,
                facilityID: chosenFacilityID,
              };
              // Step 3: Soft-delete all extra USR rows (indices 1..n)
              const deleteRequests = oldPairs.slice(1).map((p: any) =>
                this.worklocationmapping.DeleteWorkLocationMapping({
                  uSRMappingID: p.uSRMappingID,
                  deleted: true,
                }),
              );
              this.worklocationmapping
                .UpdateWorkLocationMapping(primaryLangObj)
                .pipe(takeUntil(this.destroy$))
                .subscribe(
                  () => {
                    if (deleteRequests.length > 0) {
                      forkJoin(deleteRequests)
                        .pipe(takeUntil(this.destroy$))
                        .subscribe(
                          () => {
                            this.alertService.alert(
                              'Mapping updated successfully',
                              'success',
                            );
                            this.showTable();
                            this.getAllMappedWorkLocations();
                            this.bufferArray.data = [];
                            this.bufferArray.paginator = this.paginatorSecond;
                          },
                          () => {
                            this.alertService.alert(
                              'Mapping updated but extra rows could not be removed. Contact admin.',
                              'error',
                            );
                            this.showTable();
                            this.getAllMappedWorkLocations();
                          },
                        );
                    } else {
                      this.alertService.alert(
                        'Mapping updated successfully',
                        'success',
                      );
                      this.showTable();
                      this.getAllMappedWorkLocations();
                      this.bufferArray.data = [];
                      this.bufferArray.paginator = this.paginatorSecond;
                    }
                  },
                  () => {
                    this.alertService.alert(
                      'Failed to update mapping',
                      'error',
                    );
                  },
                );
            },
            () => {
              this.alertService.alert(
                'Failed to clear ASHA supervisor mappings. Work location not updated.',
                'error',
              );
            },
          );
      }
      // ASHA Supervisor: update existing rows, create new rows if facilities changed
      else if (
        this.editIsAshaSupervisor &&
        this.editAshaMappingPairs.length > 0
      ) {
        const oldPairs = this.editAshaMappingPairs;
        const oldFacilityIDs = oldPairs.map((p) => p.facilityID);
        // Use new facility IDs from sub-component if available, else keep old ones
        const newFacilityIDs =
          this.editFacilityMappingData?.facilityIDs?.length > 0
            ? this.editFacilityMappingData.facilityIDs
            : oldFacilityIDs;

        const reusableCount = Math.min(oldPairs.length, newFacilityIDs.length);
        const allRequests: any[] = [];

        // Update existing rows — reuse uSRMappingIDs with new facilityIDs
        for (let i = 0; i < reusableCount; i++) {
          const langObj: any = {
            uSRMappingID: oldPairs[i].uSRMappingID,
            userID: this.userID_duringEdit,
            roleID: workLocations.role,
            teleConsultation: this.teleConsultationEdit,
            providerServiceMapID: this.providerServiceMapID_duringEdit,
            blockID: this.ServiceEditblock,
            blockName: this.blockname,
            villageID: editVillageIdArray,
            villageName:
              editVillageNameArray.length > 0 ? editVillageNameArray : null,
            workingLocationID: this.isFacilityServicelineEdit
              ? null
              : this.workLocationID_duringEdit,
            stateID: this.stateID_duringEdit,
            districtID: this.district_duringEdit,
            modifiedBy: this.createdBy,
            facilityID: newFacilityIDs[i],
          };
          allRequests.push(
            this.worklocationmapping.UpdateWorkLocationMapping(langObj),
          );
        }

        // Soft-delete extra old rows when facilities reduced (e.g., had [A,B], now [A])
        for (let i = reusableCount; i < oldPairs.length; i++) {
          const deleteObj = {
            uSRMappingID: oldPairs[i].uSRMappingID,
            deleted: true,
          };
          allRequests.push(
            this.worklocationmapping.DeleteWorkLocationMapping(deleteObj),
          );
        }

        // Only create new rows for facilities that have at least one ASHA worker assigned
        const ashaMappedFacilitySet1 = new Set(
          (this.editFacilityMappingData?.ashaSupervisorMappings || []).map(
            (m: any) => m.facilityID,
          ),
        );

        // Create new rows for extra facilities (admin added more)
        for (let i = reusableCount; i < newFacilityIDs.length; i++) {
          if (!ashaMappedFacilitySet1.has(newFacilityIDs[i])) continue;
          const newObj: any = {
            previleges: [
              {
                ID: [
                  {
                    roleID: workLocations.role,
                    teleConsultation: this.teleConsultationEdit,
                    inbound: null,
                    outbound: null,
                  },
                ],
                providerServiceMapID: this.providerServiceMapID_duringEdit,
                workingLocationID: this.isFacilityServicelineEdit
                  ? null
                  : this.workLocationID_duringEdit,
                stateID: this.stateID_duringEdit,
                districtID: this.district_duringEdit,
                blockID: this.ServiceEditblock,
                blockName: this.blockname,
                villageID: editVillageIdArray,
                villageName:
                  editVillageNameArray.length > 0 ? editVillageNameArray : null,
                facilityID: newFacilityIDs[i],
              },
            ],
            userID: this.userID_duringEdit,
            createdBy: this.createdBy,
            serviceProviderID: this.serviceProviderID,
          };
          allRequests.push(
            this.worklocationmapping.SaveWorkLocationMapping([newObj]),
          );
        }

        // Step 1: ASHA supervisor mapping FIRST
        const allFacilityIDsForDelete = [
          ...new Set([...oldFacilityIDs, ...newFacilityIDs]),
        ].filter((id) => id != null);

        this.updateAshaSupervisorMappings(
          allFacilityIDsForDelete,
          (oldMappings: any[]) => {
            // Step 2: Work location rows AFTER ASHA mapping succeeds
            forkJoin(allRequests)
              .pipe(takeUntil(this.destroy$))
              .subscribe(
                () => {
                  this.alertService.alert(
                    'Mapping updated successfully',
                    'success',
                  );
                  this.showTable();
                  this.getAllMappedWorkLocations();
                  this.bufferArray.data = [];
                  this.bufferArray.paginator = this.paginatorSecond;
                },
                () => {
                  // Work location failed — rollback ASHA mapping and restore old ones
                  this.rollbackAshaSupervisorMappingWithRestore(
                    this.userID_duringEdit,
                    allFacilityIDsForDelete,
                    oldMappings,
                  );
                },
              );
          },
        );
      } else if (
        this.editIsAshaSupervisor &&
        this.editFacilityMappingData?.facilityIDs?.length > 0
      ) {
        // ASHA Supervisor without existing facilities (old user):
        // Step 1: ASHA supervisor mapping FIRST
        // Only use facilities that have at least one ASHA worker assigned
        const ashaMappedFacilitySet2 = new Set(
          (this.editFacilityMappingData?.ashaSupervisorMappings || []).map(
            (m: any) => m.facilityID,
          ),
        );
        const facilityIDs = (
          this.editFacilityMappingData.facilityIDs as any[]
        ).filter((id) => ashaMappedFacilitySet2.has(id));
        if (facilityIDs.length === 0) {
          this.alertService.alert(
            'No ASHA workers assigned to the selected facilities. Please assign ASHA workers before saving.',
            'error',
          );
          return;
        }
        const firstFacilityID = facilityIDs[0];

        this.updateAshaSupervisorMappings(facilityIDs, (oldMappings: any[]) => {
          // Step 2: Work location rows AFTER ASHA mapping succeeds
          const langObj: any = {
            uSRMappingID: this.uSRMappingID,
            userID: this.userID_duringEdit,
            roleID: workLocations.role,
            teleConsultation: this.teleConsultationEdit,
            providerServiceMapID: this.providerServiceMapID_duringEdit,
            blockID: this.ServiceEditblock,
            blockName: this.blockname,
            villageID: editVillageIdArray,
            villageName:
              editVillageNameArray.length > 0 ? editVillageNameArray : null,
            workingLocationID: this.isFacilityServicelineEdit
              ? null
              : this.workLocationID_duringEdit,
            stateID: this.stateID_duringEdit,
            districtID: this.district_duringEdit,
            modifiedBy: this.createdBy,
            facilityID: firstFacilityID,
          };

          this.worklocationmapping
            .UpdateWorkLocationMapping(langObj)
            .pipe(takeUntil(this.destroy$))
            .subscribe(
              () => {
                // If multiple facilities, create new rows for the additional facilities
                if (facilityIDs.length > 1) {
                  const additionalRequests = facilityIDs
                    .slice(1)
                    .map((fID: any) => {
                      const newObj: any = {
                        previleges: [
                          {
                            ID: [
                              {
                                roleID: workLocations.role,
                                teleConsultation: this.teleConsultationEdit,
                                inbound: null,
                                outbound: null,
                              },
                            ],
                            providerServiceMapID:
                              this.providerServiceMapID_duringEdit,
                            workingLocationID: this.isFacilityServicelineEdit
                              ? null
                              : this.workLocationID_duringEdit,
                            stateID: this.stateID_duringEdit,
                            districtID: this.district_duringEdit,
                            blockID: this.ServiceEditblock,
                            blockName: this.blockname,
                            villageID: editVillageIdArray,
                            villageName:
                              editVillageNameArray.length > 0
                                ? editVillageNameArray
                                : null,
                            facilityID: fID,
                          },
                        ],
                        userID: this.userID_duringEdit,
                        createdBy: this.createdBy,
                        serviceProviderID: this.serviceProviderID,
                      };
                      return this.worklocationmapping.SaveWorkLocationMapping([
                        newObj,
                      ]);
                    });

                  forkJoin(additionalRequests)
                    .pipe(takeUntil(this.destroy$))
                    .subscribe(
                      () => {
                        this.alertService.alert(
                          'Mapping updated successfully',
                          'success',
                        );
                        this.showTable();
                        this.getAllMappedWorkLocations();
                        this.bufferArray.data = [];
                        this.bufferArray.paginator = this.paginatorSecond;
                      },
                      (err: any) => {
                        // Additional rows failed — revert first row back to original state
                        const revertObj: any = {
                          uSRMappingID: this.uSRMappingID,
                          userID: this.userID_duringEdit,
                          roleID: workLocations.role,
                          teleConsultation: this.teleConsultationEdit,
                          providerServiceMapID:
                            this.providerServiceMapID_duringEdit,
                          blockID: this.edit_Details.blockID,
                          blockName: this.edit_Details.blockName,
                          villageID: this.edit_Details.villageID,
                          villageName: this.edit_Details.villageName,
                          workingLocationID: this.workLocationID_duringEdit,
                          modifiedBy: this.createdBy,
                          facilityID: this.edit_Details.facilityID || null,
                        };
                        this.worklocationmapping
                          .UpdateWorkLocationMapping(revertObj)
                          .pipe(takeUntil(this.destroy$))
                          .subscribe(
                            () => {
                              // First row reverted — now rollback ASHA mapping and restore old
                              this.rollbackAshaSupervisorMappingWithRestore(
                                this.userID_duringEdit,
                                facilityIDs,
                                oldMappings,
                              );
                            },
                            () => {
                              // Revert also failed — still try ASHA rollback
                              this.alertService.alert(
                                'Additional rows failed. First row revert also failed — contact admin.',
                                'error',
                              );
                              this.rollbackAshaSupervisorMappingWithRestore(
                                this.userID_duringEdit,
                                facilityIDs,
                                oldMappings,
                              );
                            },
                          );
                      },
                    );
                } else {
                  this.alertService.alert(
                    'Mapping updated successfully',
                    'success',
                  );
                  this.showTable();
                  this.getAllMappedWorkLocations();
                  this.bufferArray.data = [];
                  this.bufferArray.paginator = this.paginatorSecond;
                }
              },
              (err: any) => {
                // Work location failed — rollback ASHA mapping and restore old
                this.rollbackAshaSupervisorMappingWithRestore(
                  this.userID_duringEdit,
                  facilityIDs,
                  oldMappings,
                );
              },
            );
        });
      } else if (
        isStillAshaSupervisor &&
        this.editFacilityMappingData?.isAshaSupervisor
      ) {
        // Role changed TO ASHA Supervisor (e.g. ASHA → ASHA Sup, CHO → ASHA Sup)
        // Only use facilities that have ASHA workers assigned
        const ashaMappedSet = new Set(
          (this.editFacilityMappingData?.ashaSupervisorMappings || []).map(
            (m: any) => m.facilityID,
          ),
        );
        const supFacilityIDs = (
          (this.editFacilityMappingData.facilityIDs as any[]) || []
        ).filter((id) => ashaMappedSet.has(id));

        if (supFacilityIDs.length === 0) {
          this.alertService.alert(
            'No ASHA workers assigned to the selected facilities. Please assign ASHA workers before saving.',
            'error',
          );
          return;
        }

        const firstFacilityID = supFacilityIDs[0];

        // Step 1: Save ASHA supervisor mappings first
        const newMappings =
          this.editFacilityMappingData.ashaSupervisorMappings.map((m: any) => ({
            supervisorUserID: this.userID_duringEdit,
            ashaUserID: m.ashaUserID,
            facilityID: m.facilityID,
            createdBy: this.createdBy,
          }));

        this.facilityMasterService
          .saveAshaSupervisorMapping(newMappings)
          .pipe(takeUntil(this.destroy$))
          .subscribe(
            () => {
              // Step 2: Update existing USR row with first facility
              const primaryObj: any = {
                uSRMappingID: this.uSRMappingID,
                userID: this.userID_duringEdit,
                roleID: workLocations.role,
                teleConsultation: this.teleConsultationEdit,
                providerServiceMapID: this.providerServiceMapID_duringEdit,
                blockID: this.ServiceEditblock,
                blockName: this.blockname,
                villageID: editVillageIdArray,
                villageName:
                  editVillageNameArray.length > 0 ? editVillageNameArray : null,
                workingLocationID: this.isFacilityServicelineEdit
                  ? null
                  : this.workLocationID_duringEdit,
                stateID: this.stateID_duringEdit,
                districtID: this.district_duringEdit,
                modifiedBy: this.createdBy,
                facilityID: firstFacilityID,
              };

              this.worklocationmapping
                .UpdateWorkLocationMapping(primaryObj)
                .pipe(takeUntil(this.destroy$))
                .subscribe(
                  () => {
                    // Step 3: Create new USR rows for additional facilities
                    if (supFacilityIDs.length > 1) {
                      const additionalReqs = supFacilityIDs
                        .slice(1)
                        .map((fID: any) => {
                          const newObj: any = {
                            previleges: [
                              {
                                ID: [
                                  {
                                    roleID: workLocations.role,
                                    teleConsultation: this.teleConsultationEdit,
                                    inbound: null,
                                    outbound: null,
                                  },
                                ],
                                providerServiceMapID:
                                  this.providerServiceMapID_duringEdit,
                                workingLocationID: this
                                  .isFacilityServicelineEdit
                                  ? null
                                  : this.workLocationID_duringEdit,
                                stateID: this.stateID_duringEdit,
                                districtID: this.district_duringEdit,
                                blockID: this.ServiceEditblock,
                                blockName: this.blockname,
                                villageID: editVillageIdArray,
                                villageName:
                                  editVillageNameArray.length > 0
                                    ? editVillageNameArray
                                    : null,
                                facilityID: fID,
                              },
                            ],
                            userID: this.userID_duringEdit,
                            createdBy: this.createdBy,
                            serviceProviderID: this.serviceProviderID,
                          };
                          return this.worklocationmapping.SaveWorkLocationMapping(
                            [newObj],
                          );
                        });

                      forkJoin(additionalReqs)
                        .pipe(takeUntil(this.destroy$))
                        .subscribe(
                          () => {
                            this.alertService.alert(
                              'Mapping updated successfully',
                              'success',
                            );
                            this.showTable();
                            this.getAllMappedWorkLocations();
                            this.bufferArray.data = [];
                            this.bufferArray.paginator = this.paginatorSecond;
                          },
                          () => {
                            this.alertService.alert(
                              'Mapping updated but extra facility rows failed. Contact admin.',
                              'error',
                            );
                            this.showTable();
                            this.getAllMappedWorkLocations();
                          },
                        );
                    } else {
                      this.alertService.alert(
                        'Mapping updated successfully',
                        'success',
                      );
                      this.showTable();
                      this.getAllMappedWorkLocations();
                      this.bufferArray.data = [];
                      this.bufferArray.paginator = this.paginatorSecond;
                    }
                  },
                  () => {
                    // USR update failed — rollback ASHA supervisor mappings
                    this.rollbackAshaSupervisorMapping(
                      this.userID_duringEdit,
                      supFacilityIDs,
                    );
                  },
                );
            },
            () => {
              this.alertService.alert(
                'Failed to save ASHA supervisor mapping. Work location not updated.',
                'error',
              );
            },
          );
      } else {
        // Single row update (FLW/HWC non-ASHA or standard)
        const langObj: any = {
          uSRMappingID: this.uSRMappingID,
          userID: this.userID_duringEdit,
          roleID: workLocations.role,
          teleConsultation: this.teleConsultationEdit,
          providerServiceMapID: this.providerServiceMapID_duringEdit,
          blockID: this.ServiceEditblock,
          blockName: this.blockname,
          villageID: editVillageIdArray,
          villageName:
            editVillageNameArray.length > 0
              ? editVillageNameArray
              : this.isFacilityServicelineEdit
                ? null
                : this.serviceEditvillage,
          workingLocationID: this.isFacilityServicelineEdit
            ? null
            : this.workLocationID_duringEdit,
          stateID: this.stateID_duringEdit,
          districtID: this.district_duringEdit,
          modifiedBy: this.createdBy,
        };

        if (this.isFacilityServicelineEdit && this.editFacilityMappingData) {
          langObj.facilityID = this.editFacilityMappingData.facilityID;
        }

        this.worklocationmapping
          .UpdateWorkLocationMapping(langObj)
          .pipe(takeUntil(this.destroy$))
          .subscribe(
            (response: any) => {
              this.alertService.alert(
                'Mapping updated successfully',
                'success',
              );
              this.showTable();
              this.getAllMappedWorkLocations();
              this.bufferArray.data = [];
              this.bufferArray.paginator = this.paginatorSecond;
            },
            (err: any) => {
              this.alertService.alert('Failed to update mapping', 'error');
            },
          );
      }
    }
  }

  updateData(workLocations: any, roleValue: any) {
    const langObj = {
      uSRMappingID: this.uSRMappingID,

      userID: this.userID_duringEdit,

      roleID: workLocations.role,

      teleConsultation: this.teleConsultationEdit,

      inbound:
        roleValue.toLowerCase() === 'supervisor' ? false : this.isInboundEdit,

      outbound:
        roleValue.toLowerCase() === 'supervisor' ? false : this.isOutboundEdit,

      providerServiceMapID: this.providerServiceMapID_duringEdit,

      workingLocationID: this.workLocationID_duringEdit,

      stateID: this.stateID_duringEdit,

      districtID: this.district_duringEdit,

      modifiedBy: this.createdBy,
    };

    this.worklocationmapping
      .UpdateWorkLocationMapping(langObj)

      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (response: any) => {
          this.alertService.alert('Mapping updated successfully', 'success');

          this.showTable();

          this.getAllMappedWorkLocations();

          this.bufferArray.data = [];
          this.bufferArray.paginator = this.paginatorSecond;
        },
        (err: any) => {
          this.alertService.alert('Failed to update mapping', 'error');
        },
      );
  }
  checkHWCDuplicateMainArrayForEditScreen(workLocations: any) {
    let result = false;
    if (this.mappedWorkLocationsList.length !== 0) {
      this.mappedWorkLocationsList.forEach((mappedWorkLocations: any) => {
        if (
          mappedWorkLocations.serviceID === 9 &&
          workLocations.state !== mappedWorkLocations.stateID &&
          workLocations.district !== mappedWorkLocations.workingDistrictID &&
          workLocations.ServiceEditblock !== mappedWorkLocations.blockID &&
          mappedWorkLocations.userID === this.userID_duringEdit &&
          mappedWorkLocations.uSRMappingID !== this.uSRMappingID
        ) {
          if (!mappedWorkLocations.userServciceRoleDeleted) {
            result = true;
          }
        }
      });
    }
    return result;
  }

  filterComponentList(searchTerm?: string) {
    if (!searchTerm) {
      this.filteredmappedWorkLocationsList.data = this.groupedWorkLocationsList;
      this.filteredmappedWorkLocationsList.paginator = this.paginatorFirst;
      this.filteredAshaSupervisorList.data = this.ashaSupervisorGroupedList;
      this.filteredAshaSupervisorList.paginator = this.paginatorAsha;
    } else {
      const lowerSearch = searchTerm.toLowerCase();
      const filtered: any[] = [];
      const filteredAsha: any[] = [];
      const filterFn = (group: any) => {
        for (const key of [
          'userName',
          'serviceName',
          'stateName',
          'workingDistrictName',
          'blockName',
          'locationName',
          'realName',
        ]) {
          const value: string = '' + (group[key] || '');
          if (value.toLowerCase().indexOf(lowerSearch) >= 0) return true;
        }
        if (
          group.villageName?.some((vn: string) =>
            ('' + vn).toLowerCase().includes(lowerSearch),
          )
        )
          return true;
        if (group.roleNamesDisplay?.toLowerCase().includes(lowerSearch))
          return true;
        return false;
      };
      this.groupedWorkLocationsList.forEach((group: any) => {
        if (filterFn(group)) filtered.push(group);
      });
      this.ashaSupervisorGroupedList.forEach((group: any) => {
        if (filterFn(group)) filteredAsha.push(group);
      });
      this.filteredmappedWorkLocationsList.data = filtered;
      this.filteredmappedWorkLocationsList.paginator = this.paginatorFirst;
      this.filteredAshaSupervisorList.data = filteredAsha;
      this.filteredAshaSupervisorList.paginator = this.paginatorAsha;
    }
  }

  resetAllFields() {
    this.State = undefined;
    this.Serviceline = undefined;
    this.District = undefined;
    this.WorkLocation = undefined;
    this.Role = undefined;
    this.resetAllArrays();
    this.disableSelectRoles = false;
    this.blockFlag = false;
    this.villageFlag = false;
    this.isFacilityServiceline = false;
    this.isBlockRequired = false;
    this.isVillageRequired = false;
    this.Serviceblock = undefined;
    this.Servicevillage = undefined;
    this.teleConsultation = null;
    this.teleConsultationFlag = false;
    this.createUserVillageIDs = [];
    this.createUserVillageNames = [];
    this.collectUserExistingVillages();
  }

  // Edit-mode search for the plain (MMU/TM) Village dropdown — mirrors
  // Create's villageSearch/filteredVillagesList, kept separate since Edit
  // uses its own array (editVillageArr) and a villageName-string model
  // (serviceEditvillage) rather than Create's village-object model.
  serviceEditVillageSearch = '';

  get filteredEditVillageList(): any[] {
    if (!this.serviceEditVillageSearch) return this.editVillageArr;
    const s = this.serviceEditVillageSearch.toLowerCase();
    const selectedNames = new Set(this.serviceEditvillage || []);
    return this.editVillageArr.filter(
      (v: any) =>
        selectedNames.has(v.villageName) ||
        (v.villageName || '').toLowerCase().includes(s),
    );
  }

  get allEditVillagesSelected(): boolean {
    if (!this.editVillageArr?.length) return false;
    const selected = new Set(this.serviceEditvillage || []);
    return this.editVillageArr.every((v: any) => selected.has(v.villageName));
  }

  toggleSelectAllEditVillages() {
    if (this.allEditVillagesSelected) {
      this.serviceEditvillage = [];
    } else {
      this.serviceEditvillage = this.editVillageArr.map(
        (v: any) => v.villageName,
      );
    }
  }

  collectUserExistingVillages() {
    if (!this.User?.userID) return;
    const userID = this.User.userID;
    const villageIDSet = new Set<number>();
    const villageIDToName = new Map<number, string>();

    // Use the grouped lists — villageID arrays are properly built there
    const allGroups: GroupedWorkLocation[] = [
      ...this.groupedWorkLocationsList,
      ...this.ashaSupervisorGroupedList,
    ];
    for (const group of allGroups) {
      if (group.userID !== userID) continue;
      if (!group.anyActive) continue;
      if (Array.isArray(group.villageID)) {
        group.villageID.forEach((vid: any, idx: number) => {
          const id = Number(vid);
          if (!villageIDSet.has(id)) {
            villageIDSet.add(id);
            villageIDToName.set(
              id,
              Array.isArray(group.villageName)
                ? group.villageName[idx] || ''
                : '',
            );
          }
        });
      }
    }
    this.createUserVillageIDs = Array.from(villageIDSet);
    this.createUserVillageNames = this.createUserVillageIDs.map(
      (id) => villageIDToName.get(id) || '',
    );
  }

  resetBlockVillageFields() {
    this.Serviceblock = undefined;
    this.Servicevillage = undefined;
  }

  resetEditBlockVillageFields() {
    this.ServiceEditblock = undefined;
    this.serviceEditvillage = undefined;
  }

  showInboundOutbound(value: any) {
    this.isInbound = false;
    this.isOutbound = false;
    if (value === '1097') this.showInOutBound = true;
    else this.showInOutBound = false;
  }

  setInbound(event: any) {
    if (!event.checked) {
      this.isInbound = false;
    } else this.isInbound = true;
  }

  setOutbound(event: any) {
    if (!event.checked) {
      this.isOutbound = false;
    } else this.isOutbound = true;
  }

  onEditRoleChange(roleID: any) {
    const selected = this.RolesList.find((r: any) => r.roleID === roleID);
    if (!selected) return;

    const oldIsAshaSup = this.editIsAshaSupervisor;
    const newIsAshaSup =
      (selected.roleName || '').toLowerCase() === 'asha supervisor';

    this.editRoleName = selected.roleName || '';

    // If role crosses the ASHA Supervisor boundary (to or from), reset all
    // facility/village inputs so the child starts fresh — correct single vs
    // multi facility mode, no pre-populated data, no orphan red villages
    if (oldIsAshaSup !== newIsAshaSup) {
      this.editIsAshaSupervisor = newIsAshaSup;
      this.editSupervisorUserID = newIsAshaSup ? this.userID_duringEdit : null;
      this.editExistingFacilityID = null;
      this.editExistingFacilityIDs = [];
      this.editExistingFacilityNames = [];
      this.editExistingFacilityName = '';
      this.editExistingFacilityTypeID = null;
      this.editExistingRuralUrban = '';
      this.editExistingVillageIDs = [];
      this.editExistingVillageNames = [];
      this.editFacilityMappingData = null;
    }
  }

  showInboundOutboundEdit(value: any, role: any) {
    const editRoleName = this.RolesList.filter((response: any) => {
      if (role === response.roleID) {
        return response;
      }
    })[0];

    this.isInboundEdit = false;
    this.isOutboundEdit = false;
    if (value === 1 && !(editRoleName.roleName.toLowerCase() === 'supervisor'))
      this.showInOutBoundEdit = true;
    else this.showInOutBoundEdit = false;
  }

  showBlockDrop(serviceline: any) {
    if (
      serviceline === 'FLW' ||
      serviceline === 'HWC' ||
      serviceline === 'TM' ||
      serviceline === 'MMU' ||
      serviceline === 'Stop TB'
    ) {
      this.blockFlag = true;
      this.villageFlag = true;
      this.isFacilityServiceline =
        serviceline === 'FLW' || serviceline === 'HWC';
      this.isStopTBServiceline = serviceline === 'Stop TB';
      if (serviceline === 'TM' || serviceline === 'MMU') {
        this.isBlockRequired = false;
        this.isVillageRequired = false;
      } else {
        this.isBlockRequired = true;
        this.isVillageRequired =
          this.isFacilityServiceline || this.isStopTBServiceline ? false : true;
      }
    } else {
      this.blockFlag = false;
      this.villageFlag = false;
      this.isFacilityServiceline = false;
      this.isStopTBServiceline = false;
      this.isBlockRequired = false;
      this.isVillageRequired = false;
    }
    this.resetNikshaySelection();
  }

  showEditBlockDrop(serviceName: any) {
    if (
      serviceName === 'FLW' ||
      serviceName === 'HWC' ||
      serviceName === 'TM' ||
      serviceName === 'MMU' ||
      serviceName === 'Stop TB'
    ) {
      this.enableEditBlockFlag = true;
      this.enableEditVillageFlag = true;
      this.isFacilityServicelineEdit =
        serviceName === 'FLW' || serviceName === 'HWC';
    } else {
      this.enableEditBlockFlag = false;
      this.enableEditVillageFlag = false;
      this.ServiceEditblock = null;
      this.blockname = null;
      this.villageIdValue = null;
      this.serviceEditvillage = null;
      this.isFacilityServicelineEdit = false;
    }
  }

  getBlockMaster(District: any) {
    this.villagemasterService
      .getTaluks(District.districtID)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (response: any) => this.getTalukSuccessHandeler(response.data),
        (err: any) => {
          this.alertService.alert('Failed to load blocks', 'error');
        },
      );
  }

  getTalukSuccessHandeler(response: any) {
    if (response) {
      this.blockId = response[0].blockID;
      this.blocks = response;
    }
  }

  getVillageMaster(Serviceblock: any) {
    const requestObject = {
      blockID: Serviceblock.blockID,
    };
    this.villagemasterService
      .getVillage(requestObject)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (response: any) => this.getVillageSuccessHandeler(response),
        (err: any) => {
          this.alertService.alert('Failed to load villages', 'error');
        },
      );
  }

  getVillageSuccessHandeler(response: any) {
    if (response) {
      this.village = response.data;
    }
  }

  getEditBlockMaster(district_duringEdit: any) {
    this.villagemasterService
      .getTaluks(district_duringEdit)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (response: any) => {
          if (response && response.data) {
            // console.log('this.searchForm', this.searchForm.valid, this.searchForm.value);
            this.editblocks = response.data;
          }
        },
        (err: any) => {
          this.alertService.alert('Failed to load blocks', 'error');
        },
      );
  }

  getEditBlockPatchMaster(district_duringEdit: any) {
    if (!district_duringEdit || isNaN(district_duringEdit)) return;
    this.villagemasterService
      .getTaluks(district_duringEdit)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (response: any) => {
          if (response && response.data) {
            this.editblocks = response.data;
            this.ServiceEditblock = this.edit_Details.blockID;
            this.blockname = this.edit_Details.blockName;
            this.enableEditBlockFlag = true;
            if (this.ServiceEditblock) {
              this.getEditVillagePatchMaster(this.ServiceEditblock);
            }
          }
        },
        (err: any) => {
          this.alertService.alert('Failed to load blocks', 'error');
        },
      );
  }

  getEditVillageMaster(ServiceEditblock: any) {
    const requestObject = {
      blockID: ServiceEditblock,
    };
    this.villagemasterService
      .getVillage(requestObject)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (response: any) => this.getEditVillageSuccessHandeler(response),
        (err: any) => {
          this.alertService.alert('Failed to load villages', 'error');
        },
      );
  }

  getEditVillageSuccessHandeler(response: any) {
    if (response && response.data) {
      this.editVillageArr = response.data;
    }
  }

  getEditVillagePatchMaster(ServiceEditblock: any) {
    const requestObject = {
      blockID: ServiceEditblock,
    };
    this.villagemasterService
      .getVillage(requestObject)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (response: any) => this.getEditPatchVillageSuccessHandeler(response),
        (err: any) => {
          this.alertService.alert('Failed to load villages', 'error');
        },
      );
  }

  getEditPatchVillageSuccessHandeler(response: any) {
    if (response && response.data) {
      this.editVillageArr = response.data;
      this.enableEditVillageFlag = true;
      this.villageIdValue = this.edit_Details.villageID;
      this.serviceEditvillage = this.edit_Details.villageName;
    }
  }

  setUpdatedBlockName(blockname: any) {
    this.blockname = blockname;
  }
  teleConsultationSaveFunction(source: string, selectedItem: any): void {
    if (source === 'Serviceline' || source === 'Role') {
      this.handleSelectionChanges();
    }
  }

  handleSelectionChanges() {
    const roleSanjArry: any = [];
    if (this.Role) {
      this.Role.filter((item: any) => {
        roleSanjArry.push(item.roleName.toLowerCase());
      });
    }

    if (
      this.Serviceline.serviceName === 'HWC' &&
      (roleSanjArry.includes('nurse') || roleSanjArry.includes('doctor'))
    ) {
      this.teleConsultationFlag = true;

      if (
        this.teleConsultation !== 'ESanjeevani' &&
        this.teleConsultation !== 'Swymed'
      ) {
        this.teleConsultation = 'Not Required';
      }
    } else {
      this.teleConsultationFlag = false;
      this.teleConsultation = null;
    }
  }

  teleConsultationEditSaveFunction(value: any, role: any) {
    let editRoleName = null;
    if (this.RolesList) {
      editRoleName = this.RolesList.filter((response: any) => {
        if (role === response.roleID) {
          return response;
        }
      })[0];
    }

    if (
      editRoleName &&
      this.edit_Details.serviceName === 'HWC' &&
      (editRoleName.roleName.toLowerCase() === 'nurse' ||
        editRoleName.roleName.toLowerCase() === 'doctor')
    ) {
      this.teleConsultationEdit = 'Not Required';
      this.teleConsultationEditFlag = true;
    } else {
      this.teleConsultationEdit = null;
      this.teleConsultationEditFlag = false;
    }
  }

  checkHWCDuplicateBufferArray() {
    let result = false;
    if (this.bufferArray.data.length > 0) {
      this.bufferArray.data.forEach((bufferArrayList: any) => {
        if (
          bufferArrayList.serviceName === 'HWC' &&
          this.State.stateName !== bufferArrayList.stateName &&
          this.District.districtName !== bufferArrayList.district &&
          this.Serviceblock.blockID !== bufferArrayList.blockID &&
          bufferArrayList.userID === this.User.userID
        ) {
          result = true;
        }
      });
    }
    return result;
  }
  checkHWCDuplicateMainArray() {
    let result = false;

    if (this.mappedWorkLocationsList.length !== 0) {
      this.mappedWorkLocationsList.forEach((mappedWorkLocations: any) => {
        if (
          mappedWorkLocations.serviceName === 'HWC' &&
          this.State.stateName !== mappedWorkLocations.stateName &&
          this.District.districtName !==
            mappedWorkLocations.workingDistrictName &&
          this.Serviceblock.blockID !== mappedWorkLocations.blockID &&
          mappedWorkLocations.userID === this.User.userID
        ) {
          if (!mappedWorkLocations.userServciceRoleDeleted) {
            result = true;
          }
        }
      });
    }
    return result;
  }

  // --- Facility Mapping Integration ---
  currentFacilityMappingData: any = null;

  getSelectedRoleName(): string {
    if (Array.isArray(this.Role) && this.Role.length > 0) {
      return this.Role[0].roleName;
    }
    if (this.Role?.roleName) {
      return this.Role.roleName;
    }
    return '';
  }

  isVolunteerSelected(): boolean {
    if (Array.isArray(this.Role)) {
      return this.Role.some(
        (r: any) => (r.roleName || '').toLowerCase() === 'volunteer',
      );
    }
    return (this.Role?.roleName || '').toLowerCase() === 'volunteer';
  }

  isVolunteerSelectedEdit(): boolean {
    if (Array.isArray(this.roleIDs_duringEdit) && this.RolesList) {
      return this.roleIDs_duringEdit.some((rid: any) => {
        const role = this.RolesList.find((r: any) => r.roleID === rid);
        return role && (role.roleName || '').toLowerCase() === 'volunteer';
      });
    }
    return false;
  }

  noAshaWorkersCreate = false;
  noAshaWorkersEdit = false;

  onFacilityMappingDataReceived(data: any) {
    this.currentFacilityMappingData = data;
  }

  onEditFacilityMappingDataReceived(data: any) {
    console.log(
      '[DEBUG] editFacilityMappingData received:',
      JSON.stringify(data),
    );
    this.editFacilityMappingData = data;
  }

  onNoAshaWorkersCreate(flag: boolean) {
    this.noAshaWorkersCreate = flag;
  }

  onNoAshaWorkersEdit(flag: boolean) {
    this.noAshaWorkersEdit = flag;
  }

  // ── Grouped row helpers ──

  // Village lists (especially Stop TB's, sourced from an entire TU/facility)
  // can run to hundreds of comma-joined names. The list table renders this
  // in a fixed-width scrollable cell (see .village-cell-scroll) instead of
  // stretching the row or the whole table, so joining with ", " here is
  // just for readability in that cell and its tooltip.
  asVillageText(villageName: any): string {
    if (!villageName) return '';
    return Array.isArray(villageName)
      ? villageName.join(', ')
      : String(villageName);
  }

  getUniqueRoles(roles: RoleEntry[]): RoleEntry[] {
    if (!roles) return [];
    const seen = new Set<string>();
    return roles.filter((r) => {
      if (seen.has(r.roleName)) return false;
      seen.add(r.roleName);
      return true;
    });
  }

  getGroupFacilityDisplay(group: any): string {
    if (!group.roles) return 'N/A';
    const activeRoles = group.roles.filter(
      (r: any) => !r.userServciceRoleDeleted,
    );
    const names: string[] = [];
    const seen = new Set<string>();
    for (const r of activeRoles) {
      const name = this.facilityNameMap.get(r.uSRMappingID);
      if (name && !seen.has(name)) {
        seen.add(name);
        names.push(name);
      }
    }
    return names.length > 0 ? names.join(', ') : 'N/A';
  }

  loadFacilityNamesForGroups() {
    // Build facilityNameMap from row data (facilityName now included in getMappedRole response)
    this.facilityNameMap.clear();
    for (const row of this.mappedWorkLocationsList) {
      if (
        (row.serviceName === 'FLW' || row.serviceName === 'HWC') &&
        row.uSRMappingID &&
        row.facilityName
      ) {
        this.facilityNameMap.set(row.uSRMappingID, row.facilityName);
      }
    }
  }

  getGroupInbound(group: any): string {
    if (group.serviceName !== '1097') return 'N/A';
    const activeRole = group.roles?.find(
      (r: any) =>
        !r.userServciceRoleDeleted &&
        !r.userDeleted &&
        !r.providerServiceMappingDeleted,
    );
    return activeRole?.inbound != null ? String(activeRole.inbound) : 'N/A';
  }

  getGroupOutbound(group: any): string {
    if (group.serviceName !== '1097') return 'N/A';
    const activeRole = group.roles?.find(
      (r: any) =>
        !r.userServciceRoleDeleted &&
        !r.userDeleted &&
        !r.providerServiceMappingDeleted,
    );
    return activeRole?.outbound != null ? String(activeRole.outbound) : 'N/A';
  }

  getRoleNameById(roleID: number): string {
    const role = this.RolesList.find((r: any) => r.roleID === roleID);
    return role ? role.roleName : '';
  }

  getEditVillageArrays(): {
    editVillageIdArray: any[];
    editVillageNameArray: string[];
  } {
    const editVillageIdArray: any[] = [];
    const editVillageNameArray: string[] = [];
    if (this.isFacilityServicelineEdit && this.editFacilityMappingData) {
      editVillageIdArray.push(
        ...(this.editFacilityMappingData.villageIDs || []),
      );
      editVillageNameArray.push(
        ...(this.editFacilityMappingData.villageNames || []),
      );
    } else if (this.serviceEditvillage?.length > 0) {
      this.serviceEditvillage.forEach((item: any) => {
        this.editVillageArr.forEach((itemValue: any) => {
          if (item === itemValue.villageName) {
            editVillageIdArray.push(itemValue.districtBranchID);
            editVillageNameArray.push(itemValue.villageName);
          }
        });
      });
    }
    return { editVillageIdArray, editVillageNameArray };
  }

  // ── Edit grouped row ──

  editGroupedRow(group: GroupedWorkLocation) {
    this.editGroupedElement = group;
    const firstRow = group.originalRows[0];

    // Reset stale block so child component waits for getEditBlockPatchMaster
    // before being created (prevents race condition with facility loading)
    this.ServiceEditblock = undefined;

    this.showEditForm();
    this.edit = true;
    this.disableUsername = true;
    this.edit_Details = firstRow;
    this.uSRMappingID = firstRow.uSRMappingID;
    this.userID_duringEdit = firstRow.userID;
    this.stateID_duringEdit = firstRow.stateID;
    this.providerServiceMapID_duringEdit = firstRow.providerServiceMapID;
    this.district_duringEdit = parseInt(firstRow.workingDistrictID, 10);
    this.serviceID_duringEdit = firstRow.serviceID;
    const parsedWLID = parseInt(firstRow.workingLocationID, 10);
    this.workLocationID_duringEdit = isNaN(parsedWLID) ? null : parsedWLID;

    // Multi-select: pre-check all active role IDs
    this.roleIDs_duringEdit = [
      ...new Set(
        group.roles
          .filter(
            (r) =>
              !r.userServciceRoleDeleted &&
              !r.userDeleted &&
              !r.providerServiceMappingDeleted,
          )
          .map((r) => r.roleID),
      ),
    ];
    this.roleID_duringEdit =
      this.roleIDs_duringEdit.length > 0 ? this.roleIDs_duringEdit[0] : null;

    // Inbound/outbound from first active role
    const firstActive = group.roles.find(
      (r) =>
        !r.userServciceRoleDeleted &&
        !r.userDeleted &&
        !r.providerServiceMappingDeleted,
    );
    this.isInboundEdit = firstActive?.inbound || false;
    this.isOutboundEdit = firstActive?.outbound || false;

    if (firstRow.serviceName === '1097') {
      this.showInOutBoundEdit = group.roles.some(
        (r) =>
          r.roleName.toLowerCase() !== 'supervisor' &&
          !r.userServciceRoleDeleted,
      );
    } else {
      this.showInOutBoundEdit = false;
    }

    // Teleconsultation
    if (
      firstRow.serviceName === 'HWC' &&
      group.roles.some(
        (r) =>
          (r.roleName.toLowerCase() === 'nurse' ||
            r.roleName.toLowerCase() === 'doctor') &&
          r.teleConsultation,
      )
    ) {
      this.teleConsultationEditFlag = true;
      this.teleConsultationEdit = firstActive?.teleConsultation || null;
    } else {
      this.teleConsultationEditFlag = false;
      this.teleConsultationEdit = null;
    }

    // Facility serviceline detection
    this.isFacilityServicelineEdit =
      firstRow.serviceName === 'FLW' || firstRow.serviceName === 'HWC';

    // Stop TB / Nikshay detection — this was previously only set in the
    // unused editRow() function, never here (the actual grouped-row edit
    // entry point), so the TU/Facility/Village fields never rendered on
    // Edit and it silently fell through to the generic Work Location field.
    this.isBlockRequiredEdit = firstRow.serviceName === 'Stop TB';
    this.isStopTBServicelineEdit = firstRow.serviceName === 'Stop TB';
    if (this.isStopTBServicelineEdit) {
      this.loadNikshayEditSelections();
    } else {
      this.resetNikshaySelection();
    }

    if (this.isFacilityServicelineEdit) {
      // Use merged group villages (union of all roles) instead of firstRow only
      this.editExistingVillageIDs = Array.isArray(group.villageID)
        ? group.villageID.slice()
        : [];
      this.editExistingVillageNames = Array.isArray(group.villageName)
        ? group.villageName.slice()
        : [];
      this.editServiceName = firstRow.serviceName || '';
      this.editRoleName = firstActive?.roleName || firstRow.roleName || '';

      // ASHA Supervisor detection (for update logic only)
      const isAshaSup = group.roles.some(
        (r) =>
          (r.roleName || '').toLowerCase() === 'asha supervisor' &&
          !r.userServciceRoleDeleted,
      );
      this.editIsAshaSupervisor = isAshaSup;
      this.editSupervisorUserID = isAshaSup ? firstRow.userID : null;
      this.editAshaMappingPairs = isAshaSup
        ? group.roles
            .filter(
              (r) =>
                (r.roleName || '').toLowerCase() === 'asha supervisor' &&
                !r.userServciceRoleDeleted,
            )
            .map((r) => ({
              uSRMappingID: r.uSRMappingID,
              facilityID: r.facilityID,
            }))
        : [];

      // Reset facility edit fields
      this.editExistingFacilityID = null;
      this.editExistingFacilityName = '';
      this.editExistingFacilityNames = [];
      this.editExistingFacilityIDs = [];
      this.editExistingFacilityTypeID = null;
      this.editExistingRuralUrban = '';
      this.editFacilityMappingData = null;

      // Read facility details directly from row data (populated by backend batch query)
      if (isAshaSup) {
        // ASHA Supervisor: collect facility info from all active ASHA Supervisor role rows
        const ashaRoles = group.roles.filter(
          (r) =>
            (r.roleName || '').toLowerCase() === 'asha supervisor' &&
            !r.userServciceRoleDeleted,
        );
        const facilityIDs: number[] = [];
        const facilityNames: string[] = [];
        const pairs: { uSRMappingID: any; facilityID: any }[] = [];
        for (const r of ashaRoles) {
          const origRow = group.originalRows.find(
            (row: any) => row.uSRMappingID === r.uSRMappingID,
          );
          const fID =
            origRow?.facilityID != null && origRow?.facilityID !== 0
              ? origRow.facilityID
              : null;
          const fName = origRow?.facilityName || '';
          if (fID) {
            facilityIDs.push(fID);
            facilityNames.push(fName || 'Facility ID ' + fID);
          }
          pairs.push({ uSRMappingID: r.uSRMappingID, facilityID: fID });
        }
        this.editExistingFacilityIDs = [...new Set(facilityIDs)];
        this.editExistingFacilityNames = facilityNames;
        this.editAshaMappingPairs = pairs;
        this.editExistingFacilityID =
          facilityIDs.length > 0 ? facilityIDs[0] : null;
        this.editExistingFacilityName =
          facilityNames.length > 0 ? facilityNames[0] : '';
      } else {
        // Non-ASHA: read facility from first active role's row data
        for (const row of group.originalRows) {
          const role = group.roles.find(
            (r) =>
              r.uSRMappingID === row.uSRMappingID && !r.userServciceRoleDeleted,
          );
          if (role && row.facilityID != null && row.facilityID !== 0) {
            this.editExistingFacilityID = row.facilityID;
            this.editExistingFacilityName = row.facilityName || '';
            this.editExistingFacilityTypeID =
              row.facilityTypeID != null && row.facilityTypeID !== 0
                ? row.facilityTypeID
                : null;
            this.editExistingRuralUrban = row.ruralUrban || '';
            this.editExistingFacilityIDs = [row.facilityID];
            this.editExistingFacilityNames = [
              row.facilityName || 'Facility ID ' + row.facilityID,
            ];
            break;
          }
        }
      }
    }

    this.getProviderServices(this.userID);
    this.checkService_forIsNational();

    // Load states for dropdown WITHOUT clearing districts/roles/workLocations
    this.worklocationmapping
      .getStates(this.userID, this.serviceID_duringEdit, this.isNational_edit)
      .pipe(takeUntil(this.destroy$))
      .subscribe((response: any) => {
        if (response && response.data) {
          this.states_array = response.data;
        }
      });

    if (
      this.edit_Details.stateID === undefined ||
      this.edit_Details.stateID === null
    ) {
      this.set_currentPSM_ID_duringEdit(firstRow.providerServiceMapID);
      this.stateID_duringEdit = '';
      this.district_duringEdit = null;

      if (this.isFacilityServicelineEdit || this.isStopTBServicelineEdit) {
        // HWC/FLW with null workLocationID: derive state from providerServiceMapID,
        // then load districts + blocks so dropdowns are pre-populated
        this.worklocationmapping
          .getStates(
            this.userID,
            this.serviceID_duringEdit,
            this.isNational_edit,
          )
          .pipe(takeUntil(this.destroy$))
          .subscribe((response: any) => {
            if (response && response.data) {
              this.states_array = response.data;
              const matchState = this.states_array.find(
                (s: any) =>
                  Number(s.providerServiceMapID) ===
                  Number(firstRow.providerServiceMapID),
              );
              if (matchState) {
                this.stateID_duringEdit = matchState.stateID;
                this.providerServiceMapID_duringEdit =
                  matchState.providerServiceMapID;
                // Load districts for this state
                this.worklocationmapping
                  .getAllDistricts(matchState.stateID)
                  .pipe(takeUntil(this.destroy$))
                  .subscribe((distRes: any) => {
                    if (distRes && distRes.data) {
                      this.districts_array = distRes.data;
                      // Set district from workingDistrictID if available
                      const distID = parseInt(
                        this.edit_Details.workingDistrictID,
                        10,
                      );
                      if (!isNaN(distID) && distID) {
                        this.district_duringEdit = distID;
                        this.getEditBlockPatchMaster(distID);
                      }
                    }
                  });
              }
            }
          });
        // Load roles immediately (doesn't depend on state/district)
        this.getAllRoles_duringEdit2(
          this.serviceID_duringEdit,
          this.providerServiceMapID_duringEdit,
          this.userID_duringEdit,
        );
      } else {
        // Other services: chain via work locations
        this.getAllWorkLocations_duringEdit2(
          this.states_array[0]?.stateID,
          this.serviceID_duringEdit,
          this.isNational_edit,
          this.district_duringEdit,
          this.providerServiceMapID_duringEdit,
          this.userID_duringEdit,
        );
      }
    } else {
      // Load districts, THEN set district value + load blocks + load roles
      // (district_duringEdit must be set AFTER districts_array loads for mat-select to match)
      this.worklocationmapping
        .getAllDistricts(firstRow.stateID)
        .pipe(takeUntil(this.destroy$))
        .subscribe(
          (response: any) => {
            if (response) {
              this.districts_array = response.data;
              // Set district value AFTER options are loaded. Skipped for Stop
              // TB — district_duringEdit already holds the Nikshay district
              // ID resolved by loadNikshayEditSelections() above, and
              // workingDistrictID (AMRIT) is always null for Stop TB rows,
              // which would otherwise overwrite it with NaN.
              if (!this.isStopTBServicelineEdit) {
                this.district_duringEdit = parseInt(
                  this.edit_Details.workingDistrictID,
                  10,
                );
              }
              // Load blocks → set ServiceEditblock → load villages
              if (
                !isNaN(this.district_duringEdit) &&
                this.district_duringEdit &&
                (this.isFacilityServicelineEdit ||
                  firstRow.serviceName === 'TM' ||
                  firstRow.serviceName === 'MMU')
              ) {
                this.getEditBlockPatchMaster(this.district_duringEdit);
              }
              // HWC/FLW/Stop TB: no workingLocationID — load roles directly
              // Other services: chain via work locations
              if (
                this.isFacilityServicelineEdit ||
                this.isStopTBServicelineEdit
              ) {
                this.getAllRoles_duringEdit2(
                  this.serviceID_duringEdit,
                  this.providerServiceMapID_duringEdit,
                  this.userID_duringEdit,
                );
              } else {
                this.getAllWorkLocations_duringEdit2(
                  this.stateID_duringEdit,
                  this.serviceID_duringEdit,
                  this.isNational_edit,
                  this.district_duringEdit,
                  this.providerServiceMapID_duringEdit,
                  this.userID_duringEdit,
                );
              }
            }
          },
          () => {
            this.alertService.alert('Failed to load districts', 'error');
          },
        );
    }
  }

  onEditRolesChanged(selectedRoleIDs: number[]) {
    if (this.serviceID_duringEdit === 1) {
      const hasSupervisorOnly = selectedRoleIDs.every((rid) => {
        const role = this.RolesList.find((r: any) => r.roleID === rid);
        return role?.roleName?.toLowerCase() === 'supervisor';
      });
      this.showInOutBoundEdit =
        !hasSupervisorOnly && selectedRoleIDs.length > 0;
    }
    if (this.edit_Details?.serviceName === 'HWC') {
      const hasNurseOrDoctor = selectedRoleIDs.some((rid) => {
        const role = this.RolesList.find((r: any) => r.roleID === rid);
        return (
          role?.roleName?.toLowerCase() === 'nurse' ||
          role?.roleName?.toLowerCase() === 'doctor'
        );
      });
      this.teleConsultationEditFlag = hasNurseOrDoctor;
      if (!hasNurseOrDoctor) this.teleConsultationEdit = null;
    }
  }

  // ── Update grouped work location ──

  updateGroupedWorkLocation(workLocations: any) {
    if (!this.editGroupedElement) {
      this.updateWorkLocation(workLocations);
      return;
    }

    // ASHA Supervisor: has multi-facility logic (reuse/create/delete per facility)
    // which is handled properly in updateWorkLocation(), not here.
    // The rolesToKeep loop below uses find() which only gets the first ASHA entry,
    // missing the other facility mappings.
    if (this.editIsAshaSupervisor) {
      // Multi-select dropdown sends role as array — normalize to single roleID
      workLocations.role = this.roleID_duringEdit;
      this.updateWorkLocation(workLocations);
      return;
    }

    const group = this.editGroupedElement;
    const existingRoleIDs = [
      ...new Set(
        group.roles
          .filter((r) => !r.userServciceRoleDeleted)
          .map((r) => Number(r.roleID)),
      ),
    ];
    const newRoleIDs: number[] = (this.roleIDs_duringEdit || []).map(
      (rid: any) => Number(rid),
    );

    const rolesToAdd = newRoleIDs.filter(
      (rid) => !existingRoleIDs.includes(rid),
    );
    const rolesToRemove = existingRoleIDs.filter(
      (rid) => !newRoleIDs.includes(rid),
    );
    const rolesToKeep = newRoleIDs.filter((rid) =>
      existingRoleIDs.includes(rid),
    );

    const allRequests: any[] = [];
    const { editVillageIdArray, editVillageNameArray } =
      this.getEditVillageArrays();

    // Stop TB: block/village fields come from the Nikshay TU/Facility/
    // Village pickers instead of the generic AMRIT block/village pickers
    // every other serviceline uses here. This is the same in-place update
    // path everyone else already uses (UpdateWorkLocationMapping ->
    // updateUserRoleMapping, which already handles NikshayTUID/
    // NikshayFacilityID) — no need for Stop TB's own deactivate-and-
    // recreate mechanism, which left a trail of deactivated ghost rows on
    // every edit.
    const nikshayTUIDArr = this.isStopTBServicelineEdit
      ? (this.selectedNikshayTUs || []).map((tu: any) => tu.nikshayTUID)
      : [];
    const nikshayTUNameArr = this.isStopTBServicelineEdit
      ? (this.selectedNikshayTUs || []).map((tu: any) => tu.tUName)
      : [];
    const nikshayFacilityIDArr = this.isStopTBServicelineEdit
      ? (this.selectedNikshayFacilities || []).map(
          (f: any) => f.nikshayFacilityID,
        )
      : [];
    // Villageid takes the Nikshay Village picker's selection directly on
    // Edit (explicit instruction — Edit overwrites, Create does not).
    // NOTE: Villageid holds AMRIT village IDs everywhere else in the
    // system, including the mobile app's own beneficiary worklist match
    // (BenFlowStatus.villageID) — writing Nikshay village IDs here means
    // that match breaks until a Nikshay-village-to-AMRIT-village bridge
    // table exists to translate between the two numbering systems. A
    // worker saved through this path will not see beneficiaries in the
    // mobile worklist for these villages until that bridge is built.
    const nikshayVillageIDArr = this.isStopTBServicelineEdit
      ? (this.selectedNikshayVillages || []).map((v: any) => v.nikshayVillageID)
      : [];
    const nikshayVillageNameArr = this.isStopTBServicelineEdit
      ? (this.selectedNikshayVillages || []).map((v: any) => v.villageName)
      : [];

    // Same as Create (setWorkLocationObject): store whichever TU the admin
    // actually picked via "Select Block" (selectedNikshayBlock), not just
    // whichever TU landed first in the multi-select array — otherwise a
    // saved row's blockID silently drifts to array order instead of the
    // admin's actual Block pick, and re-editing shows the wrong block.
    // Falls back to the first selected TU only when Block was never touched.
    const blockIDToUse = this.isStopTBServicelineEdit
      ? this.selectedNikshayBlock?.nikshayTUID ??
        (nikshayTUIDArr.length ? nikshayTUIDArr[0] : null)
      : this.ServiceEditblock;
    const blockNameToUse = this.isStopTBServicelineEdit
      ? this.selectedNikshayBlock?.tUName ??
        (nikshayTUNameArr.length ? nikshayTUNameArr[0] : null)
      : this.blockname;
    const villageIDToUse = this.isStopTBServicelineEdit
      ? nikshayVillageIDArr.length
        ? nikshayVillageIDArr
        : null
      : editVillageIdArray;
    const villageNameToUse = this.isStopTBServicelineEdit
      ? nikshayVillageNameArr.length
        ? nikshayVillageNameArr
        : null
      : editVillageNameArray.length > 0
        ? editVillageNameArray
        : null;
    const nikshayTUIDToSend = nikshayTUIDArr.length
      ? nikshayTUIDArr.join(',')
      : null;
    const nikshayFacilityIDToSend = nikshayFacilityIDArr.length
      ? nikshayFacilityIDArr.join(',')
      : null;

    // Shared by "keep" (role stays checked) and "reactivate" (role was
    // unchecked before, is checked again now) — both are an in-place
    // update of an existing uSRMappingID, refreshed to the edit form's
    // current location/role fields.
    const buildRoleUpdateObj = (rid: number, uSRMappingID: any) => {
      const roleName = this.getRoleNameById(rid);
      const updateObj: any = {
        uSRMappingID,
        userID: this.userID_duringEdit,
        roleID: rid,
        providerServiceMapID: this.providerServiceMapID_duringEdit,
        workingLocationID: this.isFacilityServicelineEdit
          ? null
          : this.workLocationID_duringEdit,
        stateID: this.stateID_duringEdit,
        districtID: this.district_duringEdit,
        blockID: blockIDToUse,
        blockName: blockNameToUse,
        villageID: villageIDToUse,
        villageName: villageNameToUse,
        modifiedBy: this.createdBy,
      };
      if (this.isStopTBServicelineEdit) {
        updateObj.nikshayTUID = nikshayTUIDToSend;
        updateObj.nikshayFacilityID = nikshayFacilityIDToSend;
      }
      if (group.serviceName === '1097') {
        updateObj.inbound =
          roleName?.toLowerCase() === 'supervisor' ? false : this.isInboundEdit;
        updateObj.outbound =
          roleName?.toLowerCase() === 'supervisor'
            ? false
            : this.isOutboundEdit;
      }
      if (group.serviceName === 'HWC') {
        updateObj.teleConsultation = this.teleConsultationEdit;
      }
      if (this.isFacilityServicelineEdit && this.editFacilityMappingData) {
        updateObj.facilityID = this.editFacilityMappingData.facilityID;
      }
      return updateObj;
    };

    // UPDATE existing rows for kept roles
    for (const rid of rolesToKeep) {
      const existingEntry = group.roles.find(
        (r) => r.roleID === rid && !r.userServciceRoleDeleted,
      );
      if (existingEntry) {
        allRequests.push(
          this.worklocationmapping.UpdateWorkLocationMapping(
            buildRoleUpdateObj(rid, existingEntry.uSRMappingID),
          ),
        );
      }
    }

    // SOFT-DELETE removed roles
    for (const rid of rolesToRemove) {
      const existingEntry = group.roles.find(
        (r) => r.roleID === rid && !r.userServciceRoleDeleted,
      );
      if (existingEntry) {
        const deleteObj = {
          uSRMappingID: existingEntry.uSRMappingID,
          deleted: true,
        };
        allRequests.push(
          group.serviceID === 4
            ? this.worklocationmapping.DeleteWorkLocationMappingForTM(deleteObj)
            : this.worklocationmapping.DeleteWorkLocationMapping(deleteObj),
        );
      }
    }

    // A checked role with no active row may still have an old soft-deleted
    // row from a previous remove (group.roles keeps deleted entries too —
    // only existingRoleIDs filters them out). Reactivate that row in place
    // (same {uSRMappingID, deleted:false} call the Activate button already
    // uses) instead of creating a duplicate — otherwise every remove-then-
    // re-add cycle leaves another dead row behind for the same role.
    const rolesToReactivate = rolesToAdd.filter((rid) =>
      group.roles.some((r) => r.roleID === rid && r.userServciceRoleDeleted),
    );
    const rolesToCreateFresh = rolesToAdd.filter(
      (rid) => !rolesToReactivate.includes(rid),
    );

    for (const rid of rolesToReactivate) {
      const deadEntry = group.roles.find(
        (r) => r.roleID === rid && r.userServciceRoleDeleted,
      );
      if (deadEntry) {
        const reactivateObj = {
          uSRMappingID: deadEntry.uSRMappingID,
          deleted: false,
        };
        allRequests.push(
          group.serviceID === 4
            ? this.worklocationmapping.DeleteWorkLocationMappingForTM(
                reactivateObj,
              )
            : this.worklocationmapping.DeleteWorkLocationMapping(reactivateObj),
        );
        // Reactivating only flips the deleted flag — refresh its location/
        // role fields to what the edit form currently shows, same as a kept role.
        allRequests.push(
          this.worklocationmapping.UpdateWorkLocationMapping(
            buildRoleUpdateObj(rid, deadEntry.uSRMappingID),
          ),
        );
      }
    }

    // CREATE new rows for roles that never existed for this user+scope.
    // Batched into a single SaveWorkLocationMapping call (one previleges
    // entry, ID array holding every added role) instead of one call per
    // role. Firing them separately let the backend treat each create as
    // the sole active role for this user+serviceline+block, so parallel
    // creates raced and only the last commit stayed active — dropping
    // roles added alongside others (reproduced with StopTB Counsellor/
    // Nurse). Location fields (incl. StopTB's nikshayTUID/nikshayFacilityID)
    // are per-group, not per-role, so batching them here is unchanged.
    if (rolesToCreateFresh.length > 0) {
      const newObj: any = {
        previleges: [
          {
            ID: rolesToCreateFresh.map((rid) => {
              const roleName = this.getRoleNameById(rid);
              return {
                roleID: rid,
                teleConsultation:
                  group.serviceName === 'HWC' &&
                  (roleName?.toLowerCase() === 'nurse' ||
                    roleName?.toLowerCase() === 'doctor')
                    ? this.teleConsultationEdit
                    : null,
                inbound:
                  group.serviceName === '1097' &&
                  roleName?.toLowerCase() !== 'supervisor'
                    ? this.isInboundEdit
                    : null,
                outbound:
                  group.serviceName === '1097' &&
                  roleName?.toLowerCase() !== 'supervisor'
                    ? this.isOutboundEdit
                    : null,
              };
            }),
            providerServiceMapID: this.providerServiceMapID_duringEdit,
            workingLocationID: this.isFacilityServicelineEdit
              ? null
              : this.workLocationID_duringEdit,
            stateID: this.stateID_duringEdit,
            districtID: this.district_duringEdit,
            blockID: blockIDToUse,
            blockName: blockNameToUse,
            villageID: villageIDToUse,
            villageName: villageNameToUse,
            facilityID:
              this.isFacilityServicelineEdit && this.editFacilityMappingData
                ? this.editFacilityMappingData.facilityID
                : null,
            ...(this.isStopTBServicelineEdit
              ? {
                  nikshayTUID: nikshayTUIDToSend,
                  nikshayFacilityID: nikshayFacilityIDToSend,
                }
              : {}),
          },
        ],
        userID: this.userID_duringEdit,
        createdBy: this.createdBy,
        serviceProviderID: this.serviceProviderID,
      };
      allRequests.push(
        this.worklocationmapping.SaveWorkLocationMapping([newObj]),
      );
    }

    if (allRequests.length === 0) {
      this.alertService.alert('No changes to update');
      return;
    }

    forkJoin(allRequests)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        () => {
          this.alertService.alert('Mapping updated successfully', 'success');
          this.showTable();
          this.getAllMappedWorkLocations();
          this.bufferArray.data = [];
          this.bufferArray.paginator = this.paginatorSecond;
        },
        (err: any) => {
          this.alertService.alert('Failed to update mapping', 'error');
        },
      );
  }

  // ── Activate/Deactivate grouped rows ──

  activateGroup(group: GroupedWorkLocation) {
    const anyUserDeleted = group.roles.some((r) => r.userDeleted);
    if (anyUserDeleted) {
      this.alertService.alert('User is inactive');
      return;
    }
    const anyPSMDeleted = group.roles.some(
      (r) => r.providerServiceMappingDeleted,
    );
    if (anyPSMDeleted) {
      this.alertService.alert('State is inactive');
      return;
    }

    if (group.serviceID === 9) {
      this.foundDuplicate = false;
      for (const role of group.roles) {
        this.mappedWorkLocationsList.forEach((m: any) => {
          if (
            m.serviceID === 9 &&
            (m.stateID !== group.stateID ||
              m.workingDistrictID !== group.workingDistrictID ||
              m.blockID !== group.blockID) &&
            m.userID === group.userID &&
            !group.roles.some((r) => r.uSRMappingID === m.uSRMappingID) &&
            m.roleID === role.roleID &&
            !m.userServciceRoleDeleted
          ) {
            this.foundDuplicate = true;
          }
        });
      }
      if (this.foundDuplicate) {
        this.alertService.alert(
          'Service Already Activated either with same demographic or with same role',
        );
        return;
      }
    }

    this.alertService
      .confirm('confirm', 'Are you sure you want to Activate?')
      .subscribe((response: any) => {
        if (response) {
          const deletedRoles = group.roles.filter(
            (r) => r.userServciceRoleDeleted,
          );
          const activateRequests = deletedRoles.map((r) => {
            const obj = { uSRMappingID: r.uSRMappingID, deleted: false };
            return group.serviceID === 4
              ? this.worklocationmapping.DeleteWorkLocationMappingForTM(obj)
              : this.worklocationmapping.DeleteWorkLocationMapping(obj);
          });
          if (activateRequests.length === 0) return;
          forkJoin(activateRequests)
            .pipe(takeUntil(this.destroy$))
            .subscribe(
              () => {
                // After activation, copy villages from sibling roles if any role has empty villages
                this.syncVillagesFromSiblings(group, deletedRoles);
              },
              (err: any) => {
                this.alertService.alert('Failed to activate', 'error');
              },
            );
        }
      });
  }

  /**
   * After activation: if any role has empty villages but sibling roles in the same group
   * have villages, copy the merged group villages to those roles.
   * Also copies facilityID from sibling if missing.
   */
  private syncVillagesFromSiblings(
    group: GroupedWorkLocation,
    activatedRoles: RoleEntry[],
  ) {
    const siblingVillageIDs = group.villageID || [];
    const siblingVillageNames = group.villageName || [];

    // No sibling has villages either — nothing to copy
    if (siblingVillageIDs.length === 0) {
      this.alertService.alert('Activated successfully', 'success');
      this.searchTerm = null;
      this.getAllMappedWorkLocations();
      return;
    }

    // Find activated roles that have empty villages and need syncing
    const updateRequests: any[] = [];
    for (const r of activatedRoles) {
      const originalRow = group.originalRows.find(
        (row: any) => row.uSRMappingID === r.uSRMappingID,
      );
      const hasEmptyVillages =
        !originalRow?.villageID || originalRow.villageID.length === 0;

      if (hasEmptyVillages) {
        const updateObj: any = {
          uSRMappingID: r.uSRMappingID,
          userID: group.userID,
          roleID: r.roleID,
          providerServiceMapID: group.providerServiceMapID,
          workingLocationID: group.workingLocationID,
          blockID: group.blockID,
          blockName: group.blockName,
          villageID: siblingVillageIDs,
          villageName:
            siblingVillageNames.length > 0 ? siblingVillageNames : null,
          modifiedBy: this.createdBy,
        };
        // Copy facilityID from sibling if this role has no facility
        if (!r.facilityID) {
          const siblingWithFacility = group.roles.find(
            (sr) => sr.facilityID && sr.uSRMappingID !== r.uSRMappingID,
          );
          if (siblingWithFacility) {
            updateObj.facilityID = siblingWithFacility.facilityID;
          }
        }
        updateRequests.push(
          this.worklocationmapping.UpdateWorkLocationMapping(updateObj),
        );
      }
    }

    // No roles need village syncing
    if (updateRequests.length === 0) {
      this.alertService.alert('Activated successfully', 'success');
      this.searchTerm = null;
      this.getAllMappedWorkLocations();
      return;
    }

    // Sync villages for roles that had empty villages
    forkJoin(updateRequests)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        () => {
          this.alertService.alert('Activated successfully', 'success');
          this.searchTerm = null;
          this.getAllMappedWorkLocations();
        },
        () => {
          this.alertService.alert(
            'Activated but failed to sync villages for some roles',
            'error',
          );
          this.searchTerm = null;
          this.getAllMappedWorkLocations();
        },
      );
  }

  deactivateGroup(group: GroupedWorkLocation) {
    this.alertService
      .confirm('confirm', 'Are you sure you want to Deactivate?')
      .subscribe((response: any) => {
        if (response) {
          const activeRoles = group.roles.filter(
            (r) =>
              !r.userServciceRoleDeleted &&
              !r.userDeleted &&
              !r.providerServiceMappingDeleted,
          );
          const requests = activeRoles.map((r) => {
            const obj = { uSRMappingID: r.uSRMappingID, deleted: true };
            return group.serviceID === 4
              ? this.worklocationmapping.DeleteWorkLocationMappingForTM(obj)
              : this.worklocationmapping.DeleteWorkLocationMapping(obj);
          });
          if (requests.length === 0) return;
          forkJoin(requests)
            .pipe(takeUntil(this.destroy$))
            .subscribe(
              () => {
                this.alertService.alert('Deactivated successfully', 'success');
                this.searchTerm = null;
                this.getAllMappedWorkLocations();
              },
              (err: any) => {
                this.alertService.alert('Failed to deactivate', 'error');
              },
            );
        }
      });
  }

  // ── Buffer table grouping ──

  rebuildGroupedBuffer() {
    const groupMap = new Map<string, any>();
    for (const row of this.bufferArray.data) {
      const key = [
        row.userID,
        row.serviceID,
        row.stateName || '',
        row.district || '',
        row.blockID || '',
      ].join('|');

      if (!groupMap.has(key)) {
        groupMap.set(key, {
          ...row,
          allRoles: [...(row.roleID1 || [])],
          originalBufferRows: [row],
        });
      } else {
        const group = groupMap.get(key)!;
        group.allRoles.push(...(row.roleID1 || []));
        group.originalBufferRows.push(row);
      }
    }
    this.groupedBufferArray.data = Array.from(groupMap.values());
    if (this.paginatorSecond) {
      this.groupedBufferArray.paginator = this.paginatorSecond;
    }
    if (this.sortSecond) {
      this.groupedBufferArray.sort = this.sortSecond;
    }
  }
}
