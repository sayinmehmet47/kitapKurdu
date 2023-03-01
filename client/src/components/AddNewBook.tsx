import React from 'react';
const axios = require('axios');
axios.defaults.headers.common = {
  Authorization: `Bearer SyJfYwY87voisE14VenEe60ZHFfwXZlJ`,
};

export const AddNewBook = () => {
  (async () => {
    const apiurl = 'https://cloud-api.yandex.net/v1/disk/public/resources';
    const yandexlink = 'https://disk.yandex.ru/d/o9lNK0tpVCH7sQ';
    const params = {
      public_key: encodeURI(yandexlink),
      path: '/Meritokrasi/Türkçe [ePub]/Derecelendirilmiş Kitaplar',
      limit: 3000,
    };

    try {
      const res = await axios.get(apiurl, { params });
    } catch (e) {
      console.log(e);
    }
  })();

  return <div></div>;
};
