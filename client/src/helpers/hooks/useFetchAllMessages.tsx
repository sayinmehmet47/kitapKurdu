import axios from 'axios';
import { useEffect, useState, useCallback } from 'react';
import axiosInstance from '../axiosInstance';

export type Message = {
  _id: string;
  text: string;
  date: string;
  sender: {
    username: string;
    _id: string;
    email: string;
  };
};

const useFetchAllMessages = () => {
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshVar, setRefreshVar] = useState(false);

  const [error, setError] = useState(null);

  const refresh = () => {
    setRefreshVar((v) => !v);
  };

  useEffect(() => {
    const fetchAllMessages = async () => {
      console.log('refreshVar', refreshVar);
      try {
        const { data } = await axios.get(
          'https://kitapkurdu.onrender.com/messages/userMessages'
        );

        setAllMessages(data);
      } catch (error) {
        setError(error);
      }

      setLoading(false);
    };

    fetchAllMessages();
  }, [refreshVar]);

  return { allMessages, loading, error, refresh };
};

export default useFetchAllMessages;
