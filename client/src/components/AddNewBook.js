import React from 'react';
const axios = require('axios');
axios.defaults.headers.common = {
  Authorization: `Bearer SyJfYwY87voisE14VenEe60ZHFfwXZlJ`,
};

export const AddNewBook = () => {
  (async () => {
    const apiurl = 'https://cloud-api.yandex.net/v1/disk/public/resources';
    const yandexlink = 'https://disk.yandex.com.tr/d/sLURXWsHH4gDmw';
    const params = {
      public_key: encodeURI(yandexlink),
      path: '/',
      limit: 3500,
    };

    try {
      const res = await axios.get(apiurl, { params });

      const kitaplar = res.data._embedded.items.map((e) => {
        return {
          name: e.name,
          path: e.path,
          size: e.size,
          date: e.created,
        };
      });
      console.log(kitaplar);
    } catch (e) {
      console.log(e);
    }
  })();

  return <div></div>;
};
