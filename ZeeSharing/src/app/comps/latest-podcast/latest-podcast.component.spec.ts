import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LatestPodcastComponent } from './latest-podcast.component';

describe('LatestPodcastComponent', () => {
  let component: LatestPodcastComponent;
  let fixture: ComponentFixture<LatestPodcastComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LatestPodcastComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LatestPodcastComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
