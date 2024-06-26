import { createContext, useContext, useState } from 'react';

const DataContext = createContext(null);

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  const [data, setData] = useState({});

  const updateData = (key, value) => {
    setData(prevData => ({ ...prevData, [key]: value }));
  };

  const clearData = () => {
    setData({}); 
  };

  const value = {
    data,
    updateData,
    clearData
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
