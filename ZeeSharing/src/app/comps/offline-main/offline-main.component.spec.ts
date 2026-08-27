import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OfflineMainComponent } from './offline-main.component';

describe('OfflineMainComponent', () => {
  let component: OfflineMainComponent;
  let fixture: ComponentFixture<OfflineMainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OfflineMainComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OfflineMainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
