import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatePlayListComponent } from './create-play-list.component';

describe('CreatePlayListComponent', () => {
  let component: CreatePlayListComponent;
  let fixture: ComponentFixture<CreatePlayListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatePlayListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreatePlayListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
