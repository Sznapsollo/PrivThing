import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { Button, Form, InputGroup } from "react-bootstrap";
import { useTranslation } from 'react-i18next'
import { AppState } from '../context/Context'
import LisItem from './LisItem';
import { AiOutlineLoading } from 'react-icons/ai';
import { CiUndo } from 'react-icons/ci';
import { BiDownArrow, BiRightArrow } from "react-icons/bi";
import { BsFillArrowUpSquareFill } from 'react-icons/bs';
import { Item } from '../model';
import { FiPlusCircle } from 'react-icons/fi';
import { getNewItem, retrieveLocalStorage } from '../utils/utils';
import { MAIN_ACTIONS, SEARCH_ACTIONS } from '../context/Reducers';
import axios from 'axios';

const ItemsComp = () => {

    const { t } = useTranslation();

    const {mainState: {folders, items, itemsListRefreshTrigger, activeEditedItemPath, favourites, showFavourites, recents, showRecents}, mainDispatch, searchState, searchDispatch, settingsState: {enableFileServer, excludeFromAll, enableRecents}} = AppState();
    const { searchState: {currentFolder, sort, searchQuery} } = AppState()
    const [foldersLoaded, setFoldersLoaded] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [scrollTop, setScrollTop] = useState<number>(0);
    const itemsContainerRef = useRef(null);
    const [serverMode, setServerMode] = useState('unknown');

    const dragItem = useRef<number | null>();
    const dragOverItem = useRef<number | null>();
    const dragItemPrev = useRef<number | null>();
    const dragOverItemPrev = useRef<number | null>();
    const recentSearchContent = useRef<boolean>(false);

    const handleNewItem = () => {
        const payLoadItem: Item = getNewItem();
        mainDispatch({type: MAIN_ACTIONS.SET_EDITED_ITEM_CANDIDATE, payload: {item: payLoadItem, tab: {...payLoadItem, isNew: true}}});
    }

    const loadFromFile = (eventData: HTMLInputElement) => {
        try {
            if(!eventData?.value || !eventData?.files?.length) {
                console.warn('Incorrect picked data!!')
                return
            }
            
            let file = eventData.files[0];
            
            var reader = new FileReader();
            reader.onload = function(event:any) {
                // The file's text will be printed here
                const payLoadItem: Item = {
                    name: file.name,
                    path: eventData.value,
                    size: 0,
                    rawNote: event.target.result
                };

                mainDispatch({type: MAIN_ACTIONS.SET_EDITED_ITEM_CANDIDATE, payload: {item: payLoadItem}});
            };
        
            reader.readAsText(file);
        } catch(e) {
            alert("Can't load this file!")
        }
    }

    useEffect(() => {
        // console.log('updated: itemsListRefreshTrigger')
        let itemsLoaded: Item[] = [];
      
        let loadFilesFromLocalCache = () => {
            try {
                let localStorageFiles = retrieveLocalStorage('privthing.files');
                if(localStorageFiles) {
                    for(let localStorageFileName in localStorageFiles) {
                        let localStorageFile = localStorageFiles[localStorageFileName]
                        let lcItem: Item = {
                            folder: 'localStorage',
                            path: 'localStorage/' + localStorageFileName,
                            name: localStorageFileName,
                            size: localStorageFile.size,
                            lastModified: localStorageFile.lastModified
                        }
                        try {
                            if(searchState.searchContent && searchState.searchQuery && searchState.searchQuery.length >= 3 && localStorageFiles[localStorageFileName].data) {
                                if(lcItem.name.toLowerCase().includes(searchState.searchQuery.toLowerCase())) {
                                    // its ok
                                } else {
                                    const regex = new RegExp(`${searchState.searchQuery}`, 'g');
                                    if (!regex.test(localStorageFiles[localStorageFileName].data)) {
                                        continue
                                    }
                                }
                            }
                        } catch (error) {
                            console.error(`Error searching item ${localStorageFileName}: ${error}`);
                        }
                        itemsLoaded.push(lcItem)
                    }
                }
            } catch(e) {
                alert("Problem retrieving localStorage items")
            }
        }

        let loadFilesFromServer = async () => {
            return new Promise((resolve) => {
                if(enableFileServer === true) {
                    if(!items?.length) {
                        setIsLoading(true);
                    }
                    let searchRQBody:{type: String, searchPhrase?: string} = {type: 'getListOfFiles'};
                    if(searchState.searchContent === true && searchState.searchQuery && searchState.searchQuery.length > 3) {
                        searchRQBody.searchPhrase = searchQuery;
                    }
                    axios.post('actions', 
                        JSON.stringify(searchRQBody), 
                        {
                            headers: {
                            "Content-Type": 'application/json',
                            },
                        }
                    ).then(response => {
                        setIsLoading(false);
                        let data = response.data;
                        if(data?.status !== 0) {
                            // console.warn("Actions response", data);
                            return
                        }
                        if(data.data?.files) {
                            // NJ will fire is service is configured and works
                            setFoldersLoaded(true);
                        }
                        if(Array.isArray(data?.data?.files)) {
                            itemsLoaded = itemsLoaded.concat(data.data.files)
                        }
                        resolve(true);
                    }).catch(function(error) {
                        setIsLoading(false);
                        setFoldersLoaded(true);
                        setServerMode("offline");
                        console.warn('Fetch operation error: ', error.message);
                        resolve(true);
                    });
                } else {
                    setFoldersLoaded(true);
                    setServerMode("disabled");
                    resolve(true);
                }
            });
        }

        let performDataLoad = async () => {
            try {
                await loadFilesFromServer();

                // always load all
                loadFilesFromLocalCache();
                mainDispatch({type: MAIN_ACTIONS.SET_ITEMS, payload: itemsLoaded});
            } catch(e) {
                let excError: String = '';
                if (typeof e === "string") {
                    excError = e;
                } else if (e instanceof Error) {
                    excError = e.message;
                }
                console.warn('Fetch operation error: ', excError);
            }
            setIsLoading(false);
            setFoldersLoaded(true);
            mainDispatch({type: MAIN_ACTIONS.SET_ITEMS, payload: itemsLoaded});
        }

        performDataLoad();

    }, [itemsListRefreshTrigger]);

    useEffect(() => {
        // console.log('updated: searchState')
        // also put some debiunce here not to query server too often
        let searchContentChanged = (recentSearchContent.current !== searchState.searchContent)

        recentSearchContent.current = searchState.searchContent;

        if(searchState.searchContent === true) {
            // lets do content && filenames search
            mainDispatch({type: MAIN_ACTIONS.UPDATE_ITEMS_LIST});
        } else {
            // lets do filenames search
            // if it was switched from content search we should also update all items
            if(searchContentChanged) {
                mainDispatch({type: MAIN_ACTIONS.UPDATE_ITEMS_LIST});
            } else {
                // items same but reference change will trigger useMemo
                mainDispatch({type: MAIN_ACTIONS.SET_ITEMS, payload: items});
            }
        }
    }, [searchState]);

    const transformedItems = useMemo(() => {
        // console.log('updated memo: items, searchState')
        let transformedItemsLocal = items

        if(currentFolder) {
            transformedItemsLocal = transformedItemsLocal.filter((item) => item.folder?.toLowerCase() === currentFolder.toLowerCase());
        } else {
            if(excludeFromAll && excludeFromAll.length) {
                transformedItemsLocal = transformedItemsLocal.filter((item) => {
                    let excludeFromAllParts = excludeFromAll.split(',')
                    return item.folder && !excludeFromAllParts.find((excludeFromAllPart) => {return item.folder?.includes(excludeFromAllPart.trim())});
                });
            }            
        }

        if(sort) {
            transformedItemsLocal = transformedItemsLocal.sort((a, b) => {
                if(sort === 'nameLowToHigh') {
                return (a.name.localeCompare(b.name))
                } else if(sort === 'nameHighToLow') {
                return (b.name.localeCompare(a.name))
                } else if(sort === 'lastModifiedHighToLow') {
                return ((b.lastModified || 0) - (a.lastModified || 0))
                } else if(sort === 'lastModifiedLowToHigh') {
                return ((a.lastModified || 0) - (b.lastModified || 0))
                }
                return (a.name.localeCompare(b.name))
            })
        }

        if(searchQuery && !searchState.searchContent) {
            transformedItemsLocal = transformedItemsLocal.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        return transformedItemsLocal;
    }, [items])
    
    const handleScroll = (e: React.UIEvent<HTMLElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
    };

    const handleScrollTop = () => {
        if(!itemsContainerRef?.current) {
            return
        }
        (itemsContainerRef.current as any).scrollTo({ top: 0});
    }

    // favourites dndn stuff start

    const dragStart = (item: HTMLSpanElement, position:number) => {
        dragItem.current = position;

        const copyListItems = [...favourites];
        // copyListItems[position].isDragged = true;
        mainDispatch({type: MAIN_ACTIONS.UPDATE_FAVOURITES, payload: copyListItems});
    };

    const dragEnter = (e: HTMLSpanElement, position:number) => {
        dragOverItem.current = position;

        if(dragItem.current == null || dragOverItem.current == null) {
            return
        }

        if((dragItemPrev.current === dragOverItem.current) && ((dragOverItemPrev.current === dragItem.current))) {
            return
        }

        dragItemPrev.current = dragItem.current;
        dragOverItemPrev.current = dragOverItem.current;

        if(dragItem.current  === dragOverItem.current) {
            return
        }

        const copyListItems = [...favourites];
        const dragItemContent = copyListItems[dragItem.current];
        copyListItems.splice(dragItem.current, 1);
        copyListItems.splice(dragOverItem.current, 0, dragItemContent);
        dragItem.current = position;
        dragOverItem.current = null;
        
        // copyListItems[position].isDragged = true;

        mainDispatch({type: MAIN_ACTIONS.UPDATE_FAVOURITES, payload: copyListItems});
    };

    const drop = <T,>(e: T) => {
        const copyListItems = favourites.map((favItem) => {
            // return {...favItem, isDragged: false};
            return {...favItem};
        });
        if(dragItem.current == null || dragOverItem.current == null) {
            mainDispatch({type: MAIN_ACTIONS.UPDATE_FAVOURITES, payload: copyListItems});
            return
        }
        const dragItemContent = copyListItems[dragItem.current];
        copyListItems.splice(dragItem.current, 1);
        copyListItems.splice(dragOverItem.current, 0, dragItemContent);

        dragItem.current = null;
        dragOverItem.current = null;

        mainDispatch({type: MAIN_ACTIONS.UPDATE_FAVOURITES, payload: copyListItems});
    };

    // favourites dndn stuff end

    return (
        <div className={"items"}>
            <div className='formGroupContainer'>
                <label className='upperLabel'>{t("manualPickFile")}</label>
                <Form.Group className='formGroup'>
                    <Form.Control
                        type="file"
                        name="file"
                        placeholder=''
                        // value={[path]}
                        onChange={(e) => {
                            loadFromFile(e.target as HTMLInputElement);
                        }}
                    ></Form.Control>
                </Form.Group>
            </div>
            {
                isLoading &&
                <div style={{width: "100%", height: "100%", display: "table"}}>
                    <div style={{display: "table-cell", verticalAlign: "middle", textAlign: 'center'}}>
                        <AiOutlineLoading className='h2 loading-icon'/> &nbsp;In progress ...
                    </div>
                </div>
            } 
            {!isLoading && foldersLoaded === true && <div className='formGroupContainer smallScreenItem'>
                <label className='upperLabel'>{t("search")}</label>
                <Form.Group className='formGroup'>
                    <InputGroup>
                        <Form.Control 
                            placeholder={t("startTypingToFilterFiles")} 
                            value={searchState.searchQuery}
                            className={'m-auto ' + ((searchState.searchQuery.length > 0) ? 'filledInput' : '')}
                            onChange={(e) =>
                                {
                                    searchDispatch({
                                        type: SEARCH_ACTIONS.FILTER_BY_SEARCH, 
                                        payload: {
                                            searchQuery: e.target.value,
                                            searchContent: searchState.searchContent === true,
                                        }
                                    });
                                }
                            }
                        />
                        {
                            searchState.searchQuery && 
                            <InputGroup.Text 
                                className="clearInput" 
                                onClick={(e) => {
                                    searchDispatch({
                                        type: SEARCH_ACTIONS.FILTER_BY_SEARCH, 
                                        payload: {
                                            searchQuery: '',
                                            searchContent: searchState.searchContent === true,
                                        }
                                    });
                                }}>
                                <CiUndo/>
                            </InputGroup.Text>}
                    </InputGroup>
                    
                </Form.Group>
            </div>}
            {!isLoading && foldersLoaded === true && <div className='formGroupContainer'>
                <label className='upperLabel'>{t("sortBy")}</label>
                <Form.Group className='formGroup'>
                    <Form.Control 
                        as="select" 
                        name="sortBy"
                        value={searchState.sort}
                        onChange={(e) => {
                        searchDispatch({type: SEARCH_ACTIONS.SORT_BY, payload: e.target.value});
                        }}
                    >
                        <option value="nameLowToHigh">{t("nameLowToHigh")}</option>
                        <option value="nameHighToLow">{t("nameHighToLow")}</option>
                        <option value="lastModifiedHighToLow">{t("lastModifiedHighToLow")}</option>
                        <option value="lastModifiedLowToHigh">{t("lastModifiedLowToHigh")}</option>
                    </Form.Control>
                </Form.Group>
            </div>}
            {!isLoading && foldersLoaded === true && folders.length >= 1 && <div className='formGroupContainer'>
                <label className='upperLabel'>{t("folders")}</label>
                <Form.Group className='formGroup'>
                    <Form.Control 
                        as="select" 
                        name="currentFolder"
                        value={searchState.currentFolder}
                        onChange={(e) => {
                        searchDispatch({type: SEARCH_ACTIONS.SET_CURRENT_FOLDER, payload: e.target.value});
                        }}
                    >
                        <option value="">{t("allFolders")}</option>
                        {
                            folders.map((folder, folderIndex) => {
                                return <option key={folderIndex} value={folder.name}>{folder.name}&nbsp;({folder.itemsCount})</option>
                            })
                        }
                    </Form.Control>
                </Form.Group>
            </div>}
            {
                !isLoading && serverMode === "offline" && <div style={{wordWrap: 'break-word', fontSize: 12, paddingTop: 10, paddingBottom: 10}}>{t("storageNotConfigured")}</div>
            }
            {
                !isLoading && foldersLoaded === true && !!items?.length &&
                    <div style={{display: 'flex'}}>
                        <div style={{flex: 1, wordWrap: 'break-word', fontSize: 12, paddingTop: 10, paddingBottom: 10}} >{t("filesLoaded")} ({transformedItems.length})</div>
                        <div><Button className='btn-success' onClick={handleNewItem}>{t('new')}&nbsp;<FiPlusCircle style={{marginBottom: -1}} className='h2'/></Button></div>
                    </div>
            }
            {
                favourites && favourites.length > 0 &&
                <div>
                    <div className='favouritesContainerHeader' onClick={(e) => {
                        mainDispatch({type: MAIN_ACTIONS.TOGGLE_FAVOURITES});
                    }}>
                        <div style={{display: 'inline-block', paddingRight: 5}}>
                            {
                                showFavourites &&
                                <BiDownArrow className='h5'/>
                            }
                            {
                                !showFavourites &&
                                <BiRightArrow className='h5'/>
                            }
                        </div>
                        {t("favourites")} ({favourites.length})
                    </div>
                    {
                        showFavourites && 
                        <div className="favouritesContainer">
                            {
                                favourites.map((item, itemIndex) => {
                                    return <LisItem 
                                    key={itemIndex} 
                                    keyProp={itemIndex} 
                                    item={item} 
                                    editedItemPath={activeEditedItemPath}
                                    onDragStart={dragStart}
                                    onDragEnter={dragEnter}
                                    onDrop={drop}
                                    />
                                })
                            }
                        </div>
                    }
                </div>
            }
            {
                enableRecents && recents && recents.length > 0 &&
                <div>
                    <div className='recentsContainerHeader' onClick={(e) => {
                        mainDispatch({type: MAIN_ACTIONS.TOGGLE_RECENTS});
                    }}>
                        <div style={{display: 'inline-block', paddingRight: 5}}>
                            {
                                showRecents &&
                                <BiDownArrow className='h5'/>
                            }
                            {
                                !showRecents &&
                                <BiRightArrow className='h5'/>
                            }
                        </div>
                        {t("recents")} ({recents.length})
                    </div>
                    {
                        showRecents && 
                        <div className="recentsContainer">
                            {
                                recents.map((item, itemIndex) => {
                                    return <LisItem 
                                    key={itemIndex} 
                                    keyProp={itemIndex} 
                                    item={item} 
                                    editedItemPath={activeEditedItemPath}
                                    />
                                })
                            }
                        </div>
                    }
                </div>
            }
            <div className='itemsContainer' ref={itemsContainerRef} onScroll={handleScroll}>
            {
                !isLoading && foldersLoaded === true && !items?.length &&  
                <div className='parentFiller' onClick={handleNewItem}>
                    <div className='childCenter newBig'>
                        <FiPlusCircle style={{marginBottom: -1, width: 50, height: 50}}/>
                        <div style={{fontSize: 18}}>{t('newBig')}</div>
                        {/* <Button onClick={handleNewItem}>{t('new')}&nbsp;<FiPlusCircle style={{marginBottom: -1}} className='h2'/></Button> */}
                    </div>
                </div>
                
                
            }
            {
                !isLoading && foldersLoaded === true && transformedItems.map((item, itemIndex) => {
                    return <LisItem key={itemIndex} keyProp={itemIndex} item={item} editedItemPath={activeEditedItemPath}/>
                })
            }
            {
                (scrollTop > 0) &&
                <div style={{position: "absolute", bottom: 10, cursor: 'pointer'}} onClick={() => {
                    handleScrollTop();
                }}>
                    <BsFillArrowUpSquareFill className='h1' style={{height: 45, width: 45}}/>
                </div>
            }
            </div>
            <div className='privThingGitHubInfo'>{t('privThingOpenSource')} <a href="https://github.com/Sznapsollo/PrivThing" target="_blank">{t('privThingGitHub')}</a></div>
        </div>
    )
}

export default ItemsComp