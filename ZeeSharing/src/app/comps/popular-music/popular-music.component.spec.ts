import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopularMusicComponent } from './popular-music.component';

describe('PopularMusicComponent', () => {
  let component: PopularMusicComponent;
  let fixture: ComponentFixture<PopularMusicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopularMusicComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PopularMusicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
