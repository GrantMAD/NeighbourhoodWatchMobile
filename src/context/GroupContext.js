import React, { createContext, useState, useContext } from 'react';

const GroupContext = createContext();

export const GroupProvider = ({ children }) => {
    const [groupId, setGroupId] = useState(null);
    const [groupData, setGroupData] = useState({
        welcomeText: '',
        mainImage: null,
        vision: '',
        mission: '',
        values: '',
        objectives: '',
        executivesTitle: '',
        executives: [],
        contactEmail: '', 
    });


    return (
        <GroupContext.Provider value={{ groupId, setGroupId, groupData, setGroupData }}>
            {children}
        </GroupContext.Provider>
    );
};

export const useGroup = () => useContext(GroupContext);