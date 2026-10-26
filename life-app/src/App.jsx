import { useState } from 'react';
import './App.css';
import { auth, db } from './lib/firebase';
import { doc, setDoc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useEffect } from 'react';
import Login from './Login';

const generatePermanentUserId = async (uid) => {
  const userRef = doc(db, 'users', uid);

  return await runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef);

    if (userSnap.exists() && userSnap.data().userId) {
      return userSnap.data().userId;
    }

    const newUserId = String(Math.floor(10000000 + Math.random() * 90000000));

    transaction.set(
      userRef,
      { uid, userId: newUserId, createdAt: serverTimestamp() },
      { merge: true }
    );

    return newUserId;
  });
};

export default function App() {
  const [user, setUser] = useState(auth.currentUser);
  const [permanentUserId, setPermanentUserId] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [coverPhoto, setCoverPhoto] = useState('');
  const [myProfile, setMyProfile] = useState(null);
  useEffect(() => {
      setProfilePhoto(localStorage.getItem('lifeProfilePhoto') || '');
        setCoverPhoto(localStorage.getItem('lifeCoverPhoto') || '');
        }, []);

  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [profileData, setProfileData] = useState({ name: '', bio: '' });

  const openProfileEditor = () => {
    setEditName(profileData.name || user?.displayName || '');
    setEditBio(profileData.bio || '');
    setEditingProfile(true);
  };
  const savePhotoLocally = async (file, type) => {
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    alert('Please select an image.');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    alert('Photo 5 MB se chhoti select karo.');
    return;
  }

  const reader = new FileReader();

  reader.onload = async () => {
    try {
      const photo = reader.result;
      const image = new Image();

      image.onload = async () => {
        try {
          const canvas = document.createElement('canvas');
          const maxWidth = type === 'profile' ? 300 : 700;
          const scale = Math.min(1, maxWidth / image.width);

          canvas.width = Math.round(image.width * scale);
          canvas.height = Math.round(image.height * scale);

          const context = canvas.getContext('2d');
          context.drawImage(image, 0, 0, canvas.width, canvas.height);

          const compressedPhoto = canvas.toDataURL('image/jpeg', 0.6);

          if (compressedPhoto.length > 700000) {
            alert('Photo abhi bhi badi hai. Kripya chhoti photo chunein.');
            return;
          }

          const field = type === 'profile' ? 'profilePhoto' : 'coverPhoto';

          await setDoc(
            doc(db, 'users', user.uid),
            { [field]: compressedPhoto, updatedAt: serverTimestamp() },
            { merge: true }
          );

          if (type === 'profile') {
            localStorage.setItem('lifeProfilePhoto', compressedPhoto);
            setProfilePhoto(compressedPhoto);
          } else {
            localStorage.setItem('lifeCoverPhoto', compressedPhoto);
            setCoverPhoto(compressedPhoto);
          }

          alert('Photo Firebase mein save ho gayi! ❤️');
        } catch (error) {
          console.error('Photo save error:', error);
          alert('Photo save nahi hui. Firestore Rules check karein.');
        }
      };

      image.onerror = () => alert('Image khul nahi rahi. Doosri photo try karein.');
      image.src = photo;
    } catch (error) {
      console.error(error);
      alert('Photo save nahi hui.');
    }
  };

  reader.readAsDataURL(file);
};

  const saveEditedProfile = async () => {
    if (!user) return;
    try {
      const savedName = editName.trim() || 'New User';
      const savedBio = editBio.trim();

      await setDoc(doc(db, 'users', user.uid), {
        name: savedName,
        bio: savedBio,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setProfileData({ name: savedName, bio: savedBio });
      setEditingProfile(false);
      alert('Profile saved successfully!');
    } catch (error) {
      console.error('Profile update error:', error);
      alert('Profile save nahi hua. Firestore Rules check karna hoga.');
    }
  };

 useEffect(() => {
   if (!user) return;

     const saveUserProfile = async () => {
         try {
               await setDoc(
                       doc(db, 'users', user.uid),
                               {
                                         uid: user.uid,
          userId: await generatePermanentUserId(user.uid),
                                                   name: user.displayName || 'New User',
                                                             email: user.email || '',
                                                                       photoURL: user.photoURL || '',
                                                                                 updatedAt: serverTimestamp(),
                                                                                         },
                                                                                                 { merge: true }
                                                                                                       );
                                                                                                             console.log('User profile saved successfully');
                                                                                                                 } catch (error) {
                                                                                                                       console.error('Profile save error:', error);
                                                                                                                           }
                                                                                                                             };

                                                                                                                               saveUserProfile();
                                                                                                                               }, [user]);
  useEffect(() => {
    if (!user) {
      setPermanentUserId('');
      return;
    }

    const loadPermanentId = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
        setProfilePhoto(data.profilePhoto || localStorage.getItem('lifeProfilePhoto') || '');
        setCoverPhoto(data.coverPhoto || localStorage.getItem('lifeCoverPhoto') || '');

          setPermanentUserId(data.userId || '');
          setProfileData({
            name: data.name || user.displayName || 'New User',
            bio: data.bio || ''
          });
          setMyProfile({
  name: data.name || user.displayName || 'New User',
  photo: data.profilePhoto || user.photoURL || ''
});
        } else {
          setProfileData({
            name: user.displayName || 'New User',
            bio: ''
          });
setMyProfile({
  name: user.displayName || 'New User',
  photo: user.photoURL || ''
});
        }
      } catch (error) {
        console.error('Could not load user profile:', error);
      }
    };

    loadPermanentId();
  }, [user]);

  useEffect(() => onAuthStateChanged(auth, setUser), []);
  const [page, setPage] = useState('Home');
const [seatCount, setSeatCount] = useState(10);
const [seatChoice, setSeatChoice] = useState(10);
  const [mySeat, setMySeat] = useState(null);
  const [occupiedSeats, setOccupiedSeats] = useState({});
  
  const [lockedSeats, setLockedSeats] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);

  const chooseSeat = (n) => {
    if (lockedSeats.includes(n)) return;
    if (occupiedSeats[n] && occupiedSeats[n] !== 'You') return;
    setOccupiedSeats(prev => {
      const next = { ...prev };
      if (mySeat !== null) delete next[mySeat];
      next[n] = 'You';
      return next;
    });
    setMySeat(n);
  };
  const rooms = [
    { id: '10510566', name: 'Life Friends' },
    { id: '10510567', name: 'Music & Masti' },
    { id: '10510568', name: 'Friendship Zone' },
  ];

  if (!user) return <Login onLogin={() => setUser(auth.currentUser)} />;

  return (
    <div className="app">
     
      <header className="topbar">
        <h2>🎙️ LIFE VOICE CHAT</h2>
        <button onClick={() => setPage('Profile')}>👤 Profile</button>
          <button onClick={async () => {
            const confirmLogout = window.confirm('Do you want to logout?');
            if (!confirmLogout) return;
            try {
              await signOut(auth);
              setUser(null);
            } catch (error) {
              alert('Logout failed: ' + error.message);
            }
          }}>Logout</button>
      </header>

     {page === 'Home' && (

  <main className="home-screen"><header className="home-top">
  <button onClick={() => setPage('Profile')}>
    👤 Mine
  </button>

  <button>✨ Recommend</button>
  <button>🔥 Hot</button>

  <button onClick={() => setPage('Inbox')}>
    💬
  </button>
</header>

<section className="home-welcome">
  <h2>❤️ LIFE VOICE CHAT</h2>
  <p>Connect • Talk • Make Friends</p>
</section>

<section className="home-top-rooms">
  <h3>🏆 Top Live Rooms</h3>
  <p>Discover people and join the conversation!</p>
</section>

<section className="home-categories">
  <button>🇮🇳 India</button>
  <button>🌎 All</button>
  <button>👨‍👩‍👧 Family</button>
  <button>🤝 Friends</button>
  <button>🎵 Sing</button>
  <button>❤️ Love</button>
</section>

<section className="home-seat-setting">
  <label>🎤 Choose Room Seats: </label>

  <select
    value={seatChoice}
    onChange={(e) => {
      const count = Number(e.target.value);
      setSeatChoice(count);
      setSeatCount(count);
    }}
  >
    {Array.from({ length: 11 }, (_, i) => i + 10).map(n => (
      <option key={n} value={n}>{n} Seats</option>
    ))}
  </select>
</section>

<h3 className="home-section-title">🔥 Live Voice Rooms</h3>

<section className="home-room-grid">
  {rooms.map(room => (
    <article className="home-room-card" key={room.id}>
      <div className="home-room-cover">
        🎤
      </div>

      <div className="home-room-info">
        <h4>{room.name}</h4>
        <p>🆔 Room ID: {room.id}</p>
        <button
          className="home-join"
          onClick={() => setPage(room.name)}
        >
          Join Room
        </button>
      </div>
    </article>
  ))}
</section>

<button
  className="home-inbox-button"
  onClick={() => setPage('Inbox')}
>
  💬 Open Messages
</button>

  </main>
)}

      {page === 'Inbox' && (
        <main className="panel">
          <h2>💬 Private Inbox</h2>
          <p>Private messages will appear here.</p>
        </main>
      )}

      {page === 'Profile' && (
        <main className="panel profile-card">
         <div className="profile-cover">
  <input
    type="file"
    accept="image/*"
    id="profilePhotoInput"
    hidden
    onChange={(e) => {
      savePhotoLocally(e.target.files[0], 'profile');
      e.target.value = '';
    }}
  />

  <input
    type="file"
    accept="image/*"
    id="coverPhotoInput"
    hidden
    onChange={(e) => {
      savePhotoLocally(e.target.files[0], 'cover');
      e.target.value = '';
    }}
  />

  <div
    className="profile-cover-image"
    style={{
      backgroundImage: `url("${coverPhoto}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }}
  >
    <button
      type="button"
      onClick={() => document.getElementById('coverPhotoInput').click()}
    >
      🌄 Change Cover
    </button>
  </div>

  <img
    className="profile-dp"
    src={
      profilePhoto ||
      user?.photoURL ||
      'https://ui-avatars.com/api/?name=Life+User&background=20e3a2&color=111&size=160'
    }
    alt="Profile"
  />

  <button
    type="button"
    onClick={() => document.getElementById('profilePhotoInput').click()}
  >
    📷 Change DP
  </button>
</div>
          <h2>{profileData.name || user?.displayName || 'New User'}</h2>
          <p className="profile-id">🆔 ID: {permanentUserId || 'Loading...'}</p>
          <p className="profile-about">{profileData.bio || "Welcome to Life Voice Chat ❤️"}</p>
          <div className="profile-stats">
            <div><strong>0</strong><span>Followers</span></div>
            <div><strong>0</strong><span>Following</span></div>
            <div><strong>0</strong><span>Friends</span></div>
          </div>
          {!editingProfile ? (
            <button type="button" onClick={openProfileEditor}>
              ✏️ Edit Profile
            </button>
          ) : (
            <div className="profile-edit-form">
              <label>
                Name
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  maxLength={40}
                  placeholder="Enter your name"
                />
              </label>
              <label>
                About / Bio
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  maxLength={160}
                  placeholder="Write something about yourself"
                />
              </label>
              <button type="button" onClick={saveEditedProfile}>
                💾 Save Profile
              </button>
              <button type="button" onClick={() => setEditingProfile(false)}>
                Cancel
              </button>
            </div>
          )}
        </main>
      )}

      {rooms.map(room => page === room.name && (
        <main className="panel" key={room.id}>
          <h2>🎙️ {room.name}</h2>
          <p>Room ID: {room.id}</p>
          <div className="seats">
          {Array.from({ length: seatCount }, (_, i) => i + 1).map(n => (
              <div className="seat-wrap" key={n}>
              <button type="button" className="seat"
                onClick={() => setSelectedSeat(n)}
                disabled={Boolean(occupiedSeats[n] && occupiedSeats[n] !== 'You')}
                style={{ opacity: lockedSeats.includes(n) ? 0.45 : 1, outline: mySeat === n ? '3px solid #20e3a2' : 'none' }}>
                <span className="seat-avatar">
  {occupiedSeats[n] === 'You' ? (
    myProfile?.photo ? (
      <img
        src={myProfile.photo}
        alt={myProfile.name}
        className="seat-photo"
      />
    ) : '👤'
  ) : lockedSeats.includes(n) ? '🔒' : '👤'}
</span>
              </button>
              <small className="seat-name">
  {occupiedSeats[n] === 'You'
    ? (myProfile?.name || user?.displayName || 'You')
    : (occupiedSeats[n] || `Seat ${n}`)}
</small>
            </div>
            ))}
          </div>
          {selectedSeat !== null && (
          <section className="seat-menu">
            <h3>Seat {selectedSeat}</h3>

            <button type="button" onClick={() => {
              alert('Invite User: user list will be connected later.');
              setSelectedSeat(null);
            }}>Invite</button>

            {lockedSeats.includes(selectedSeat) ? (
              <button type="button" onClick={() => {
                setLockedSeats(prev => prev.filter(n => n !== selectedSeat));
                setSelectedSeat(null);
              }}>Unlock</button>
            ) : (
              <>
                <button type="button" onClick={() => {
                  setLockedSeats(prev => [...prev, selectedSeat]);
                  setSelectedSeat(null);
                }}>Lock</button>

                <button type="button" onClick={() => {
                  if (!occupiedSeats[selectedSeat]) {
                    chooseSeat(selectedSeat);
                  } else {
                    alert('This seat is occupied.');
                  }
                  setSelectedSeat(null);
                }}>Take Seat</button>

                <button type="button" onClick={() => {
                  if (mySeat !== null && mySeat !== selectedSeat && !occupiedSeats[selectedSeat]) {
                    chooseSeat(selectedSeat);
                  } else {
                    alert('Choose another empty seat to switch.');
                  }
                  setSelectedSeat(null);
                }}>Switch</button>
              </>
            )}

            <button type="button" onClick={() => setSelectedSeat(null)}>Close</button>
          </section>
        )}
        <p>Live voice calling will be added later.</p>
        </main>
      ))}

      <nav className="bottom-nav">
        <button onClick={() => setPage('Home')}>🏠 Home</button>
        <button onClick={() => setPage('Inbox')}>💬 Inbox</button>
        <button onClick={() => setPage('Profile')}>👤 Profile</button>
      </nav>
    </div>
  );
}

