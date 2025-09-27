export default defineBackground(() => {
  console.log('TradingView Symbol Manager Background Script loaded', { id: browser.runtime.id });

  // Handle messages from content scripts and popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message:', message, 'from:', sender);

    handleMessage(message, sender)
      .then(response => {
        console.log('Background sending response:', response);
        sendResponse(response);
      })
      .catch(error => {
        console.error('Background error handling message:', error);
        sendResponse({ success: false, error: error.message });
      });

    // Return true to indicate we'll send a response asynchronously
    return true;
  });

  // Handle storage changes and broadcast to all tabs
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
      console.log('Storage changed:', changes);
      broadcastStorageUpdate(changes);
    }
  });
});

async function handleMessage(message, sender) {
  const { type, ...data } = message;

  switch (type) {
    case 'GET_ALL_LISTS':
      return await getAllLists();

    case 'GET_LIST':
      return await getList(data.listId);

    case 'GET_CURRENT_LIST':
      return await getCurrentList();

    case 'CREATE_LIST':
      return await createList(data.name, data.symbols);

    case 'UPDATE_LIST':
      return await updateList(data.listId, data.updates);

    case 'DELETE_LIST':
      return await deleteList(data.listId);

    case 'SET_CURRENT_LIST':
      return await setCurrentList(data.listId);

    default:
      throw new Error(`Unknown message type: ${type}`);
  }
}

// Storage operations using Chrome Extension Storage API
async function getAllLists() {
  try {
    const result = await chrome.storage.local.get(['symbolLists']);
    const lists = result.symbolLists || [];
    return { success: true, lists };
  } catch (error) {
    console.error('Error getting all lists:', error);
    return { success: false, error: error.message };
  }
}

async function getList(listId) {
  try {
    const result = await chrome.storage.local.get(['symbolLists']);
    const lists = result.symbolLists || [];
    const list = lists.find(l => l.id === listId);

    if (!list) {
      return { success: false, error: 'List not found' };
    }

    return { success: true, list };
  } catch (error) {
    console.error('Error getting list:', error);
    return { success: false, error: error.message };
  }
}

async function getCurrentList() {
  try {
    const result = await chrome.storage.local.get(['currentListId', 'symbolLists']);
    const currentListId = result.currentListId;
    const lists = result.symbolLists || [];

    if (!currentListId) {
      return { success: true, list: null };
    }

    const currentList = lists.find(l => l.id === currentListId);
    return { success: true, list: currentList || null };
  } catch (error) {
    console.error('Error getting current list:', error);
    return { success: false, error: error.message };
  }
}

async function createList(name, symbols = []) {
  try {
    const result = await chrome.storage.local.get(['symbolLists']);
    const lists = result.symbolLists || [];

    const newList = {
      id: generateId(),
      name: name,
      symbols: symbols,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedLists = [...lists, newList];
    await chrome.storage.local.set({ symbolLists: updatedLists });

    return { success: true, list: newList };
  } catch (error) {
    console.error('Error creating list:', error);
    return { success: false, error: error.message };
  }
}

async function updateList(listId, updates) {
  try {
    const result = await chrome.storage.local.get(['symbolLists']);
    const lists = result.symbolLists || [];

    const listIndex = lists.findIndex(l => l.id === listId);
    if (listIndex === -1) {
      return { success: false, error: 'List not found' };
    }

    const updatedList = {
      ...lists[listIndex],
      ...updates,
      updatedAt: new Date()
    };

    lists[listIndex] = updatedList;
    await chrome.storage.local.set({ symbolLists: lists });

    return { success: true, list: updatedList };
  } catch (error) {
    console.error('Error updating list:', error);
    return { success: false, error: error.message };
  }
}

async function deleteList(listId) {
  try {
    const result = await chrome.storage.local.get(['symbolLists', 'currentListId']);
    const lists = result.symbolLists || [];
    const currentListId = result.currentListId;

    const updatedLists = lists.filter(l => l.id !== listId);
    const updates = { symbolLists: updatedLists };

    // Clear current list if it was deleted
    if (currentListId === listId) {
      updates.currentListId = null;
    }

    await chrome.storage.local.set(updates);
    return { success: true };
  } catch (error) {
    console.error('Error deleting list:', error);
    return { success: false, error: error.message };
  }
}

async function setCurrentList(listId) {
  try {
    await chrome.storage.local.set({ currentListId: listId });
    return { success: true };
  } catch (error) {
    console.error('Error setting current list:', error);
    return { success: false, error: error.message };
  }
}

// Utility function to generate unique IDs
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Broadcast storage updates to all content scripts
async function broadcastStorageUpdate(changes) {
  try {
    const tabs = await chrome.tabs.query({
      url: ['*://*.tradingview.com/*', '*://in.tradingview.com/*']
    });

    for (const tab of tabs) {
      try {
        await chrome.tabs.sendMessage(tab.id, {
          type: 'STORAGE_UPDATED',
          changes: changes
        });
      } catch (error) {
        // Tab might not have content script loaded, ignore
        console.log(`Could not send message to tab ${tab.id}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Error broadcasting storage update:', error);
  }
}
