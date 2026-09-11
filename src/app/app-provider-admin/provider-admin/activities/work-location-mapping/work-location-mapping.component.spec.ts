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
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { WorkLocationMappingComponent } from './work-location-mapping.component';
import { WorkLocationMapping } from '../services/work-location-mapping.service';
import { ConfirmationDialogsService } from 'src/app/core/services/dialog/confirmation.service';
import { VillageMasterService } from 'src/app/core/services/adminServices/AdminVillage/village-master-service.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { FacilityMasterService } from 'src/app/core/services/inventory-services/facilitytypemaster.service';

let component: WorkLocationMappingComponent;
let fixture: ComponentFixture<WorkLocationMappingComponent>;

const FakeConfirmationDialogsService = {
  alert: (_msg?: any, _type?: any) => undefined,
};

const FakeWorkLocationMapping = {
  getServices: (_userID: any) => of({ data: [] }),
  getMappedWorkLocationList: (_serviceProviderID: any) => of({ data: [] }),
  getUserName: (_serviceProviderID: any) => of({ data: [] }),
  SaveWorkLocationMapping: (_data: any) => of({}),
  UpdateWorkLocationMapping: (_data: any) => of({}),
  DeleteWorkLocationMapping: (_data: any) => of({}),
  DeleteWorkLocationMappingForTM: (_data: any) => of({}),
};

const FakeVillageMasterService = {};
const FakeFacilityMasterService = {};

const sessionValues: Record<string, any> = {
  service_providerID: 'SP1',
  uid: 'U1',
  uname: 'admin',
};
const FakeSessionStorageService = {
  getItem: (key: string) => sessionValues[key] ?? null,
};

function initTestBed() {
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [WorkLocationMappingComponent],
      schemas: [NO_ERRORS_SCHEMA],
      imports: [FormsModule],
      providers: [
        {
          provide: ConfirmationDialogsService,
          useValue: FakeConfirmationDialogsService,
        },
        { provide: WorkLocationMapping, useValue: FakeWorkLocationMapping },
        { provide: VillageMasterService, useValue: FakeVillageMasterService },
        { provide: SessionStorageService, useValue: FakeSessionStorageService },
        { provide: FacilityMasterService, useValue: FakeFacilityMasterService },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    // Deliberately not calling fixture.detectChanges(): the real template
    // uses mat-table/matSort/matPaginator directives whose modules aren't
    // imported here, and these tests only exercise component logic
    // (setWorkLocationObject etc.), not the rendered DOM. ngOnInit is
    // still run explicitly so session-storage-derived fields are set.
    fixture = TestBed.createComponent(WorkLocationMappingComponent);
    component = fixture.componentInstance;
    component.ngOnInit();
  });
}

describe('WorkLocationMappingComponent', () => {
  describe('When the component is loaded, then ngOnInit', () => {
    initTestBed();

    it('should be created', () => {
      expect(component).toBeTruthy();
    });

    it('should read createdBy from session storage', () => {
      expect(component.createdBy).toBe('admin');
    });

    it('should read serviceProviderID from session storage', () => {
      expect(component.serviceProviderID).toBe('SP1');
    });
  });

  // These tests exercise setWorkLocationObject() directly — it is pure,
  // synchronous request-building logic (no HTTP), so it can be verified
  // without a running backend. They confirm the on-Create village-save
  // behavior for each service line, including the known Stop TB gap:
  // TU/Facility save correctly, but Village is hardcoded to null on the
  // Create path (see setWorkLocationObject's isStopTBServiceline branch).
  describe('setWorkLocationObject — village save behavior per serviceline (Create)', () => {
    initTestBed();

    const baseUser = { userID: 1, userName: 'worker1' };
    const baseRole = { roleID: 5, roleName: 'Field Worker' };

    it('MMU: saves villageID/villageName from the plain village picker', () => {
      component.isStopTBServiceline = false;
      component.isFacilityServiceline = false;

      const objectToBeAdded: any = {
        user: baseUser,
        serviceline: { serviceID: 9, serviceName: 'MMU', isNational: false },
        state: { stateID: 2, stateName: 'Karnataka', providerServiceMapID: 77 },
        district: { districtID: 20, districtName: 'Bidar' },
        Serviceblock: { blockID: 300, blockName: 'Bhalki' },
        Servicevillage: [{ villageName: 'Alamkeri', districtBranchID: 555 }],
      };

      component.setWorkLocationObject(objectToBeAdded, baseRole, false, false);

      const saved = component.bufferArray.data[0];
      expect(saved.villageID).toEqual([555]);
      expect(saved.villageName).toEqual(['Alamkeri']);
    });

    it('FLW/HWC: saves villageID/villageName resolved via the facility sub-component', () => {
      component.isStopTBServiceline = false;
      component.isFacilityServiceline = true;
      component.currentFacilityMappingData = {
        villageIDs: [7, 8],
        villageNames: ['V7', 'V8'],
        facilityID: 99,
      };

      const objectToBeAdded: any = {
        user: baseUser,
        serviceline: { serviceID: 3, serviceName: 'HWC', isNational: false },
        state: { stateID: 2, stateName: 'Karnataka', providerServiceMapID: 77 },
        district: { districtID: 20, districtName: 'Bidar' },
      };

      component.setWorkLocationObject(objectToBeAdded, baseRole, false, false);

      const saved = component.bufferArray.data[0];
      expect(saved.villageID).toEqual([7, 8]);
      expect(saved.villageName).toEqual(['V7', 'V8']);
      expect(saved.facilityID).toBe(99);
    });

    it('Stop TB: saves TU, Facility, and Village all together on Create', () => {
      component.isStopTBServiceline = true;
      component.selectedNikshayTUs = [
        { nikshayTUID: 8903, tUName: 'Bhalki-TU' },
      ];
      component.selectedNikshayFacilities = [
        { nikshayFacilityID: 648139, facilityName: 'Shadole hospital' },
      ];
      component.selectedNikshayVillages = [
        { nikshayVillageID: 100, villageName: 'Alamkeri' },
      ];

      const objectToBeAdded: any = {
        user: baseUser,
        serviceline: {
          serviceID: 11,
          serviceName: 'Stop TB',
          isNational: false,
        },
        state: { stateID: 2, stateName: 'Karnataka', providerServiceMapID: 77 },
        district: { nikshayDistrictID: 312, districtName: 'Bidar' },
      };

      component.setWorkLocationObject(objectToBeAdded, baseRole, false, false);

      const saved = component.bufferArray.data[0];
      expect(saved.nikshayTUID).toBe('8903');
      expect(saved.nikshayFacilityID).toBe('648139');
      // Village selection is now saved on Create too, same as Edit.
      expect(saved.villageID).toEqual([100]);
      expect(saved.villageName).toEqual(['Alamkeri']);
    });
  });

  // Regression coverage for the StopTB "Counsellor/Nurse silently
  // dropped on Update" bug: (1) existingRoleIDs/newRoleIDs must compare
  // equal regardless of which side is a numeric string, and (2) every
  // newly-added role must go out in one SaveWorkLocationMapping call,
  // not one racing call per role.
  describe('updateGroupedWorkLocation — role add/keep/remove diffing', () => {
    initTestBed();

    const baseGroup = (roles: any[]): any => ({
      userID: 4426,
      serviceID: 11,
      serviceName: 'Stop TB',
      roles,
    });

    beforeEach(() => {
      component.RolesList = [
        { roleID: 168, roleName: 'Registration Officer' },
        { roleID: 169, roleName: 'Nurse' },
        { roleID: 170, roleName: 'Counsellor' },
      ];
      component.userID_duringEdit = 4426;
      component.providerServiceMapID_duringEdit = 1734;
      component.stateID_duringEdit = 2;
      component.district_duringEdit = 1;
      component.workLocationID_duringEdit = null;
      component.isFacilityServicelineEdit = false;
      component.isStopTBServicelineEdit = false;
      component.editIsAshaSupervisor = false;
      component.selectedNikshayTUs = [];
      component.selectedNikshayFacilities = [];
      component.selectedNikshayVillages = [];
      component.selectedNikshayBlock = null;
      component.serviceEditvillage = [];
      component.editVillageArr = [];
    });

    it('batches two newly-added roles (Nurse + Counsellor) into a single SaveWorkLocationMapping call', () => {
      const service = TestBed.inject(WorkLocationMapping);
      const saveSpy = spyOn(service, 'SaveWorkLocationMapping').and.returnValue(
        of({}),
      );

      component.editGroupedElement = baseGroup([]);
      component.roleIDs_duringEdit = [169, 170];

      component.updateGroupedWorkLocation({});

      expect(saveSpy).toHaveBeenCalledTimes(1);
      const [payload] = saveSpy.calls.mostRecent().args;
      const sentRoleIDs = payload[0].previleges[0].ID.map((r: any) => r.roleID);
      expect(sentRoleIDs).toEqual([169, 170]);
    });

    it('treats a numeric-string existing roleID as equal to a numeric selected roleID (no spurious add+remove)', () => {
      const service = TestBed.inject(WorkLocationMapping);
      const saveSpy = spyOn(service, 'SaveWorkLocationMapping').and.returnValue(
        of({}),
      );
      const updateSpy = spyOn(
        service,
        'UpdateWorkLocationMapping',
      ).and.returnValue(of({}));
      const deleteSpy = spyOn(
        service,
        'DeleteWorkLocationMapping',
      ).and.returnValue(of({}));

      // Registration Officer's roleID arrives as a string from the
      // work-location list endpoint; the checkbox sends it back as a number.
      component.editGroupedElement = baseGroup([
        {
          roleID: '168' as any,
          uSRMappingID: 5907,
          userServciceRoleDeleted: false,
        },
      ]);
      component.roleIDs_duringEdit = [168];

      component.updateGroupedWorkLocation({});

      expect(updateSpy).toHaveBeenCalledTimes(1);
      expect(saveSpy).not.toHaveBeenCalled();
      expect(deleteSpy).not.toHaveBeenCalled();
    });
  });
});
