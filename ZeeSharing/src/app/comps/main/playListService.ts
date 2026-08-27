import { Injectable } from '@angular/core';
import { Firestore, collection, getDocs, query, where, setDoc, doc } from '@angular/fire/firestore';
import { Zene } from './main.component';
@Injectable({ providedIn: 'root' })
export class PlaylistService {
  constructor(private firestore: Firestore) { }
  async getUserPlaylists(userName: string, currentMusic: Zene | null): Promise<{ title: string; type: string; contains: boolean }[]> {
    const playlistsCollection = collection(this.firestore, 'PlayLists');
    const playlistsQuery = query(playlistsCollection, where('user', '==', userName));
    const querySnapshot = await getDocs(playlistsQuery);
    return querySnapshot.docs.map(docSnapshot => ({
      title: docSnapshot.data()['title'],
      type: docSnapshot.data()['type'],
      contains: (docSnapshot.data()['songs'] || []).some((song: Zene) => song.name === currentMusic?.name)
    }));
  }
  async toggleSongInPlaylist(userName: string, playlistTitle: string, currentMusic: Zene): Promise<void> {
    const playlistsCollection = collection(this.firestore, 'PlayLists');
    const playlistsQuery = query(
      playlistsCollection,
      where('user', '==', userName),
      where('title', '==', playlistTitle)
    );
    const querySnapshot = await getDocs(playlistsQuery);
    if (!querySnapshot.empty) {
      const playlistDoc = querySnapshot.docs[0];
      const playlistData = playlistDoc.data();
      const musicList: Zene[] = playlistData['songs'] || [];
      const musicIndex = musicList.findIndex(m => m.name === currentMusic.name);
      if (musicIndex === -1) {
        musicList.push(currentMusic);
      } else {
        musicList.splice(musicIndex, 1);
      }
      await setDoc(doc(this.firestore, 'PlayLists', playlistDoc.id), {
        ...playlistData,
        songs: musicList
      });
    }
  }
}
