import { useState } from "react";

import Card from "../../components/ui/Card";

import GoldLoanDashboard from "../../components/goldLoan/GoldLoanDashboard";

import LockerManager from "../../components/goldLoan/LockerManager";

import BagManager from "../../components/goldLoan/BagManager";

import OrnamentManager from "../../components/goldLoan/OrnamentManager";

import GoldImageManager from "../../components/goldLoan/GoldImageManager";

import GoldReleaseManager from "../../components/goldLoan/GoldReleaseManager";

import type {
  GoldBag,
  GoldLocker,
  GoldOrnament,
} from "../../components/goldLoan/types";

import {
  addLocker,
  getLockers,
  updateLocker,
} from "../../store/goldLockerStore";

import { addBag, getBags, updateBag } from "../../store/goldBagStore";

import {
  addOrnament,
  deleteOrnament,
  getOrnaments,
} from "../../store/goldOrnamentStore";

import {
  addGoldImage,
  deleteGoldImage,
  getGoldImages,
} from "../../store/goldImageStore";

import {
  addRelease,
  getReleases,
  type GoldRelease,
} from "../../store/goldReleaseStore";

export default function GoldLoan() {
  const [lockers, setLockers] = useState<GoldLocker[]>(getLockers());

  const [bags, setBags] = useState<GoldBag[]>(getBags());

  const [ornaments, setOrnaments] = useState<GoldOrnament[]>(getOrnaments());

  const [images, setImages] = useState(getGoldImages());

  const [releases, setReleases] = useState<GoldRelease[]>(getReleases());

  function refreshLockers() {
    setLockers(getLockers());
  }

  function refreshBags() {
    setBags(getBags());
  }

  function refreshOrnaments() {
    setOrnaments(getOrnaments());
  }

  function refreshImages() {
    setImages(getGoldImages());
  }

  function refreshReleases() {
    setReleases(getReleases());
  }

  return (
    <div>
      <h1>Gold Loan Management</h1>

      <p>Manage lockers, bags, ornaments, images and gold release.</p>

      <GoldLoanDashboard
        lockers={lockers}
        bags={bags}
        goldLoans={[]}
        ornaments={ornaments}
      />

      <Card title="Locker Management">
        <LockerManager
          lockers={lockers}
          onAdd={(locker) => {
            addLocker(locker);

            refreshLockers();
          }}
          onUpdate={(locker) => {
            updateLocker(locker);

            refreshLockers();
          }}
        />
      </Card>

      <Card title="Bag Management">
        <BagManager
          bags={bags}
          onAdd={(bag) => {
            addBag(bag);

            refreshBags();
          }}
          onUpdate={(bag) => {
            updateBag(bag);

            refreshBags();
          }}
        />
      </Card>

      <Card title="Ornament Management">
        <OrnamentManager
          ornaments={ornaments}
          onAdd={(ornament) => {
            addOrnament(ornament);

            refreshOrnaments();
          }}
          onDelete={(id) => {
            deleteOrnament(id);

            refreshOrnaments();
          }}
        />
      </Card>

      <Card title="Gold Images">
        <GoldImageManager
          images={images}
          onAdd={(image) => {
            addGoldImage(image);

            refreshImages();
          }}
          onDelete={(id) => {
            deleteGoldImage(id);

            refreshImages();
          }}
        />
      </Card>

      <Card title="Gold Release">
        <GoldReleaseManager
          releases={releases}
          onAdd={(release) => {
            addRelease(release);

            refreshReleases();
          }}
        />
      </Card>
    </div>
  );
}
