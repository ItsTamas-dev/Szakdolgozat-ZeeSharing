import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecommendedMusicComponent } from './recommended-music.component';

describe('RecommendedMusicComponent', () => {
  let component: RecommendedMusicComponent;
  let fixture: ComponentFixture<RecommendedMusicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecommendedMusicComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecommendedMusicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
