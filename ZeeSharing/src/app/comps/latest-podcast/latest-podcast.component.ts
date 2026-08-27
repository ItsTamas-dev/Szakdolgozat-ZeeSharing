import { Component } from '@angular/core';
import { Firestore, collection, query, orderBy, limit, getDocs, where, addDoc } from '@angular/fire/firestore';
import { NgFor } from '@angular/common';
import { EventEmitter, Input, Output } from '@angular/core';
export interface Zene {
  name: string;
  audio: string;
  performer: string;
  img?: string;
  tags?: string[];
}
@Component({
  selector: 'app-latest-podcast',
  imports: [NgFor],
  templateUrl: './latest-podcast.component.html',
  styleUrl: './latest-podcast.component.css'
})
export class LatestPodcastComponent {
  @Input() latestSongs: Zene[] = [];
  @Output() songClicked = new EventEmitter<{ songs: Zene[]; index: number }>();
  async onSongSelected(performer: string, name: string) {
    const musicCollection = collection(this.firestore, 'Podcasts');
    const filteredQuery = query(musicCollection, where('performer', '==', performer));
    const musicSnapshot = await getDocs(filteredQuery);
    const songClicked = await Promise.all(
      musicSnapshot.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data();
        return {
          name: data['name'],
          audio: data['audio'],
          performer: data['performer'],
          img: data['img'] || 'https://firebasestorage.googleapis.com/v0/b/zeesharing-d33f2.appspot.com/o/image%2Flogo.png?alt=media&token=47edc7c9-f21d-4a55-a106-94df1952689e',
          tags: data['tags'] || []
        } as Zene;
      })
    );
    const foundIndex = songClicked.findIndex((song) => song.name === name);
    this.songClicked.emit({
      songs: songClicked,
      index: foundIndex,
    });
  }
  constructor(private firestore: Firestore) { }
  async ngOnInit() {
    await this.loadLatestSongs();
  }
  async loadLatestSongs() {
    const musicCollection = collection(this.firestore, 'Podcasts');
    const musicQuery = query(musicCollection, orderBy('uploadDate', 'desc'), limit(6));
    const musicSnapshot = await getDocs(musicQuery);
    this.latestSongs = await Promise.all(musicSnapshot.docs.map(async (docSnapshot) => {
      const data = docSnapshot.data();
      return {
        name: data['name'],
        audio: data['audio'],
        performer: data['performer'],
        img: data["img"] || 'https://firebasestorage.googleapis.com/v0/b/zeesharing-d33f2.appspot.com/o/image%2Flogo.png?alt=media&token=47edc7c9-f21d-4a55-a106-94df1952689e',
      };
    }));
  }
}
