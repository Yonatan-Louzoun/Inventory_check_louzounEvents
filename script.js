// הגדרת משתנים גלובליים
let inventory = []; // המערך שיחזיק את כל נתוני המלאי
let categories = ['אגרטלים', 'פמוטים / כלי נר', 'מפות / ראנרים', 'תאורה / לד', 'אחר']; // מערך הקטגוריות

// אלמנטים מה-DOM
const form = document.getElementById('inventory-form');
const tableBody = document.querySelector('#inventory-table tbody');
const totalItemsSpan = document.getElementById('total-items');
const itemTypeSelect = document.getElementById('item-type');
const newCategoryInput = document.getElementById('new-category-name');
const addCategoryBtn = document.getElementById('add-category-btn');

// --- 1. פונקציות עזר לניהול נתונים ב-LocalStorage ---

/** טוען את המלאי מ-LocalStorage */
function loadInventory() {
    const storedInventory = localStorage.getItem('eventInventory');
    if (storedInventory) {
        inventory = JSON.parse(storedInventory);
    }
}

/** שומר את המלאי ל-LocalStorage */
function saveInventory() {
    localStorage.setItem('eventInventory', JSON.stringify(inventory));
}

/** טוען את הקטגוריות מ-LocalStorage. אם אין, משתמש ברשימת ברירת המחדל. */
function loadCategories() {
    const storedCategories = localStorage.getItem('eventCategories');
    if (storedCategories) {
        categories = JSON.parse(storedCategories);
    }
}

/** שומר את הקטגוריות ל-LocalStorage */
function saveCategories() {
    localStorage.setItem('eventCategories', JSON.stringify(categories));
}

// --- 2. פונקציות ניהול קטגוריות ---

/** מציג את רשימת הקטגוריות ב-Select Box */
function renderCategoriesSelect() {
    // מנקה את הרשימה הנוכחית (משאיר את האפשרות הראשונה 'בחר קטגוריה')
    itemTypeSelect.innerHTML = '<option value="">בחר קטגוריה</option>'; 

    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        itemTypeSelect.appendChild(option);
    });
}

/** מטפל בהוספת קטגוריה חדשה */
function handleAddCategory() {
    const newCategoryName = newCategoryInput.value.trim();
    if (!newCategoryName) {
        alert('אנא הזן שם לקטגוריה.');
        return;
    }

    if (categories.includes(newCategoryName)) {
        alert(`הקטגוריה "${newCategoryName}" כבר קיימת!`);
        return;
    }

    categories.push(newCategoryName);
    saveCategories();
    renderCategoriesSelect();
    newCategoryInput.value = ''; // איפוס שדה הקלט
    alert(`הקטגוריה "${newCategoryName}" נוספה בהצלחה.`);
}


// --- 3. פונקציית עדכון / הוספת פריט (Form Submit) ---

/** מטפל בשליחת הטופס - מוסיף או מעדכן פריט */
function handleFormSubmit(event) {
    event.preventDefault(); 

    const name = document.getElementById('item-name').value.trim();
    const type = document.getElementById('item-type').value;
    const quantity = parseInt(document.getElementById('item-quantity').value, 10);

    // ולידציה בסיסית
    if (!name || !type || isNaN(quantity) || quantity < 0) {
        alert('אנא מלא את כל השדות בצורה תקינה.');
        return;
    }

    const existingItemIndex = inventory.findIndex(item => item.name === name);

    if (existingItemIndex !== -1) {
        // אם הפריט קיים, עדכן את הכמות ואת הקטגוריה (למקרה ששונו)
        inventory[existingItemIndex].quantity = quantity;
        inventory[existingItemIndex].type = type;
        alert(`הפריט '${name}' עודכן בהצלחה.`);
    } else {
        // אם הפריט חדש, הוסף אותו למערך
        inventory.push({ name, type, quantity });
        alert(`הפריט '${name}' נוסף למלאי.`);
    }

    saveInventory();
    renderInventory();
    form.reset(); // איפוס הטופס
}

// --- 4. פונקציית רינדור (הצגת המלאי בטבלה) ---

/** מציג את נתוני המלאי בטבלה ובסטטיסטיקות */
function renderInventory() {
    tableBody.innerHTML = ''; 

    if (inventory.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4">המלאי ריק. אנא הוסף פריטים.</td></tr>';
        totalItemsSpan.textContent = 0;
        return;
    }

    // מיון המלאי לפי קטגוריה ולאחר מכן לפי שם
    const sortedInventory = inventory.sort((a, b) => {
        if (a.type < b.type) return -1;
        if (a.type > b.type) return 1;
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
    });

    sortedInventory.forEach(item => {
        const row = tableBody.insertRow();
        
        row.insertCell(0).textContent = item.name;
        row.insertCell(1).textContent = item.type;
        row.insertCell(2).textContent = item.quantity;
        
        // עמודת הפעולות (עריכה ומחיקה)
        const actionCell = row.insertCell(3);
        
        // כפתור עריכה
        const editBtn = document.createElement('button');
        editBtn.textContent = 'ערוך';
        editBtn.classList.add('action-btn', 'edit-btn');
        editBtn.dataset.itemName = item.name; 
        editBtn.addEventListener('click', editItem); // הפונקציה החדשה
        actionCell.appendChild(editBtn);

        // כפתור מחיקה
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'מחק';
        deleteBtn.classList.add('action-btn', 'delete-btn');
        deleteBtn.dataset.itemName = item.name; 
        deleteBtn.addEventListener('click', deleteItem);
        actionCell.appendChild(deleteBtn);
    });

    // עדכון הסטטיסטיקות
    totalItemsSpan.textContent = inventory.length;
}

// --- 5. פונקציית עריכת פריט ישירה (Edit Item) ---

/** טוען נתוני פריט נבחר לטופס לעריכה מיידית */
function editItem(event) {
    const itemName = event.target.dataset.itemName;
    const itemToEdit = inventory.find(item => item.name === itemName);

    if (!itemToEdit) {
        alert('שגיאה: הפריט לא נמצא במלאי.');
        return;
    }

    // ממלא את הטופס בנתוני הפריט הנבחר
    document.getElementById('item-name').value = itemToEdit.name;
    document.getElementById('item-type').value = itemToEdit.type;
    document.getElementById('item-quantity').value = itemToEdit.quantity;
    
    // מציג הודעה למשתמש
    alert(`הפריט '${itemToEdit.name}' נטען לטופס. עדכן את הכמות ולחץ 'שמור / עדכן פריט'.`);
}


// --- 6. פונקציית מחיקת פריט ---

/** מוחק פריט מהמלאי לפי שם */
function deleteItem(event) {
    const itemName = event.target.dataset.itemName;
    if (confirm(`האם אתה בטוח שברצונך למחוק את הפריט: ${itemName}? פעולה זו בלתי הפיכה.`)) {
        inventory = inventory.filter(item => item.name !== itemName);
        saveInventory();
        renderInventory();
    }
}

// --- 7. אתחול והרצת הדאשבורד ---

/** פונקציה ראשית שמפעילה את הכל */
function initDashboard() {
    loadCategories(); // טוען קטגוריות
    loadInventory(); // טוען נתונים קיימים

    renderCategoriesSelect(); // מציג קטגוריות ב-Select
    renderInventory(); // מציג את נתוני המלאי
    
    // מצרף את פונקציות הטיפול לאירועים
    form.addEventListener('submit', handleFormSubmit); 
    addCategoryBtn.addEventListener('click', handleAddCategory);
}

// הפעלת הדאשבורד כאשר הדף נטען
document.addEventListener('DOMContentLoaded', initDashboard);