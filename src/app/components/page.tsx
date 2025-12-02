'use client';

import { useState } from 'react';
import styles from '../../styles/css/components.module.css';

export default function ComponentsPage() {
  const [buttonClicked, setButtonClicked] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [radioValue, setRadioValue] = useState('option1');
  const [switchChecked, setSwitchChecked] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [activeTab, setActiveTab] = useState('tab1');

  const handleButtonClick = (type: string) => {
    setButtonClicked(type);
    setTimeout(() => setButtonClicked(null), 200);
  };

  const handleShowToast = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Component Samples</h1>
      <p className={styles.pageDescription}>
        디자이너들이 구성한 컴포넌트 샘플 모음입니다. 개발 시 참고하세요.
      </p>

      {/* Buttons Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Buttons</h2>
        <div className={styles.componentGrid}>
          <div className={styles.componentCard}>
            <h3 className={styles.componentTitle}>Primary Button</h3>
            <div className={styles.componentDemo}>
              <button
                className={`${styles.button} ${styles.buttonPrimary} ${
                  buttonClicked === 'primary' ? styles.buttonClicked : ''
                }`}
                onClick={() => handleButtonClick('primary')}
              >
                Primary Button
              </button>
            </div>
            <pre className={styles.code}>
              <code>{'<button className="button buttonPrimary">Primary Button</button>'}</code>
            </pre>
          </div>

          <div className={styles.componentCard}>
            <h3 className={styles.componentTitle}>Secondary Button</h3>
            <div className={styles.componentDemo}>
              <button
                className={`${styles.button} ${styles.buttonSecondary} ${
                  buttonClicked === 'secondary' ? styles.buttonClicked : ''
                }`}
                onClick={() => handleButtonClick('secondary')}
              >
                Secondary Button
              </button>
            </div>
            <pre className={styles.code}>
              <code>{'<button className="button buttonSecondary">Secondary Button</button>'}</code>
            </pre>
          </div>

          <div className={styles.componentCard}>
            <h3 className={styles.componentTitle}>Danger Button</h3>
            <div className={styles.componentDemo}>
              <button
                className={`${styles.button} ${styles.buttonDanger} ${
                  buttonClicked === 'danger' ? styles.buttonClicked : ''
                }`}
                onClick={() => handleButtonClick('danger')}
              >
                Danger Button
              </button>
            </div>
            <pre className={styles.code}>
              <code>{'<button className="button buttonDanger">Danger Button</button>'}</code>
            </pre>
          </div>

          <div className={styles.componentCard}>
            <h3 className={styles.componentTitle}>Disabled Button</h3>
            <div className={styles.componentDemo}>
              <button className={`${styles.button} ${styles.buttonPrimary}`} disabled>
                Disabled Button
              </button>
            </div>
            <pre className={styles.code}>
              <code>{'<button className="button buttonPrimary" disabled>Disabled Button</button>'}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Input Fields Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Input Fields</h2>
        <div className={styles.componentGrid}>
          <div className={styles.componentCard}>
            <h3 className={styles.componentTitle}>Text Input</h3>
            <div className={styles.componentDemo}>
              <input
                type="text"
                placeholder="Enter text..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className={styles.input}
              />
            </div>
            <pre className={styles.code}>
              <code>{'<input type="text" placeholder="Enter text..." className="input" />'}</code>
            </pre>
          </div>

          <div className={styles.componentCard}>
            <h3 className={styles.componentTitle}>Password Input</h3>
            <div className={styles.componentDemo}>
              <input
                type="password"
                placeholder="Enter password..."
                className={styles.input}
              />
            </div>
            <pre className={styles.code}>
              <code>{'<input type="password" placeholder="Enter password..." className="input" />'}</code>
            </pre>
          </div>

          <div className={styles.componentCard}>
            <h3 className={styles.componentTitle}>Textarea</h3>
            <div className={styles.componentDemo}>
              <textarea
                placeholder="Enter message..."
                rows={4}
                className={styles.textarea}
              />
            </div>
            <pre className={styles.code}>
              <code>{'<textarea placeholder="Enter message..." className="textarea" />'}</code>
            </pre>
          </div>

          <div className={styles.componentCard}>
            <h3 className={styles.componentTitle}>Select Dropdown</h3>
            <div className={styles.componentDemo}>
              <select className={styles.select}>
                <option value="">Select an option</option>
                <option value="1">Option 1</option>
                <option value="2">Option 2</option>
                <option value="3">Option 3</option>
              </select>
            </div>
            <pre className={styles.code}>
              <code>{'<select className="select">...</select>'}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Checkbox & Radio Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Checkbox & Radio</h2>
        <div className={styles.componentGrid}>
          <div className={styles.componentCard}>
            <h3 className={styles.componentTitle}>Checkbox</h3>
            <div className={styles.componentDemo}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={checkboxChecked}
                  onChange={(e) => setCheckboxChecked(e.target.checked)}
                  className={styles.checkbox}
                />
                <span>Checkbox Label</span>
              </label>
            </div>
            <pre className={styles.code}>
              <code>{'<input type="checkbox" className="checkbox" />'}</code>
            </pre>
          </div>

          <div className={styles.componentCard}>
            <h3 className={styles.componentTitle}>Radio Buttons</h3>
            <div className={styles.componentDemo}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="radio"
                  value="option1"
                  checked={radioValue === 'option1'}
                  onChange={(e) => setRadioValue(e.target.value)}
                  className={styles.radio}
                />
                <span>Option 1</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="radio"
                  value="option2"
                  checked={radioValue === 'option2'}
                  onChange={(e) => setRadioValue(e.target.value)}
                  className={styles.radio}
                />
                <span>Option 2</span>
              </label>
            </div>
            <pre className={styles.code}>
              <code>{'<input type="radio" name="radio" className="radio" />'}</code>
            </pre>
          </div>

          <div className={styles.componentCard}>
            <h3 className={styles.componentTitle}>Switch/Toggle</h3>
            <div className={styles.componentDemo}>
              <label className={styles.switchLabel}>
                <input
                  type="checkbox"
                  checked={switchChecked}
                  onChange={(e) => setSwitchChecked(e.target.checked)}
                  className={styles.switch}
                />
                <span className={styles.switchSlider}></span>
                <span>Toggle Switch</span>
              </label>
            </div>
            <pre className={styles.code}>
              <code>{'<input type="checkbox" className="switch" />'}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Cards Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Cards</h2>
        <div className={styles.componentGrid}>
          <div className={styles.componentCard}>
            <h3 className={styles.componentTitle}>Basic Card</h3>
            <div className={styles.componentDemo}>
              <div className={styles.card}>
                <h4 className={styles.cardTitle}>Card Title</h4>
                <p className={styles.cardContent}>This is a basic card component with title and content.</p>
              </div>
            </div>
            <pre className={styles.code}>
              <code>{'<div className="card">...</div>'}</code>
            </pre>
          </div>

          <div className={styles.componentCard}>
            <h3 className={styles.componentTitle}>Card with Action</h3>
            <div className={styles.componentDemo}>
              <div className={styles.card}>
                <h4 className={styles.cardTitle}>Card with Action</h4>
                <p className={styles.cardContent}>Card with a button action.</p>
                <button className={`${styles.button} ${styles.buttonPrimary} ${styles.cardButton}`}>
                  Action
                </button>
              </div>
            </div>
            <pre className={styles.code}>
              <code>{'<div className="card">...</div>'}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Card Sizes Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Card Sizes</h2>
        <div className={styles.componentGrid}>
          <div className={styles.componentCard}>
            <h3 className={styles.componentTitle}>Small Card</h3>
            <div className={styles.componentDemo}>
              <div className={`${styles.card} ${styles.cardSmall}`}>
                <h4 className={styles.cardTitle}>Small Card</h4>
                <p className={styles.cardContent}>Small size card with compact padding.</p>
              </div>
            </div>
            <pre className={styles.code}>
              <code>{'<div className="card cardSmall">...</div>'}</code>
            </pre>
          </div>

          <div className={styles.componentCard}>
            <h3 className={styles.componentTitle}>Medium Card (Default)</h3>
            <div className={styles.componentDemo}>
              <div className={`${styles.card} ${styles.cardMedium}`}>
                <h4 className={styles.cardTitle}>Medium Card</h4>
                <p className={styles.cardContent}>Medium size card with default padding.</p>
              </div>
            </div>
            <pre className={styles.code}>
              <code>{'<div className="card cardMedium">...</div>'}</code>
            </pre>
          </div>

          <div className={styles.componentCard}>
            <h3 className={styles.componentTitle}>Large Card</h3>
            <div className={styles.componentDemo}>
              <div className={`${styles.card} ${styles.cardLarge}`}>
                <h4 className={styles.cardTitle}>Large Card</h4>
                <p className={styles.cardContent}>Large size card with more padding for emphasis.</p>
              </div>
            </div>
            <pre className={styles.code}>
              <code>{'<div className="card cardLarge">...</div>'}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Tabs Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Tabs</h2>
        <div className={styles.componentGrid}>
          <div className={styles.componentCard}>
            <h3 className={styles.componentTitle}>Basic Tabs</h3>
            <div className={styles.componentDemo}>
              <div className={styles.tabsContainer}>
                <div className={styles.tabsHeader}>
                  <button
                    className={`${styles.tab} ${activeTab === 'tab1' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('tab1')}
                  >
                    Tab 1
                  </button>
                  <button
                    className={`${styles.tab} ${activeTab === 'tab2' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('tab2')}
                  >
                    Tab 2
                  </button>
                  <button
                    className={`${styles.tab} ${activeTab === 'tab3' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('tab3')}
                  >
                    Tab 3
                  </button>
                </div>
                <div className={styles.tabContent}>
                  {activeTab === 'tab1' && <p>Content for Tab 1</p>}
                  {activeTab === 'tab2' && <p>Content for Tab 2</p>}
                  {activeTab === 'tab3' && <p>Content for Tab 3</p>}
                </div>
              </div>
            </div>
            <pre className={styles.code}>
              <code>{'<div className="tabsContainer">...</div>'}</code>
            </pre>
          </div>

          <div className={styles.componentCard}>
            <h3 className={styles.componentTitle}>Tabs with Icons</h3>
            <div className={styles.componentDemo}>
              <div className={styles.tabsContainer}>
                <div className={styles.tabsHeader}>
                  <button
                    className={`${styles.tab} ${activeTab === 'tab1' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('tab1')}
                  >
                    <span>📊</span> Analytics
                  </button>
                  <button
                    className={`${styles.tab} ${activeTab === 'tab2' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('tab2')}
                  >
                    <span>⚙️</span> Settings
                  </button>
                  <button
                    className={`${styles.tab} ${activeTab === 'tab3' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('tab3')}
                  >
                    <span>👤</span> Profile
                  </button>
                </div>
                <div className={styles.tabContent}>
                  {activeTab === 'tab1' && <p>Analytics content</p>}
                  {activeTab === 'tab2' && <p>Settings content</p>}
                  {activeTab === 'tab3' && <p>Profile content</p>}
                </div>
              </div>
            </div>
            <pre className={styles.code}>
              <code>{'<div className="tabsContainer">...</div>'}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Tables Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Tables</h2>
        <div className={styles.componentGrid}>
          <div className={styles.componentCard}>
            <h3 className={styles.componentTitle}>Basic Table</h3>
            <div className={styles.componentDemo}>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Position</th>
                      <th>Office</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>John Doe</td>
                      <td>Developer</td>
                      <td>Seoul</td>
                    </tr>
                    <tr>
                      <td>Jane Smith</td>
                      <td>Designer</td>
                      <td>Busan</td>
                    </tr>
                    <tr>
                      <td>Bob Johnson</td>
                      <td>Manager</td>
                      <td>Incheon</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <pre className={styles.code}>
              <code>{'<table className="table">...</table>'}</code>
            </pre>
          </div>

          <div className={styles.componentCard}>
            <h3 className={styles.componentTitle}>Table with Striped Rows</h3>
            <div className={styles.componentDemo}>
              <div className={styles.tableWrapper}>
                <table className={`${styles.table} ${styles.tableStriped}`}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Product</th>
                      <th>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>1</td>
                      <td>Product A</td>
                      <td>$100</td>
                    </tr>
                    <tr>
                      <td>2</td>
                      <td>Product B</td>
                      <td>$200</td>
                    </tr>
                    <tr>
                      <td>3</td>
                      <td>Product C</td>
                      <td>$300</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <pre className={styles.code}>
              <code>{'<table className="table tableStriped">...</table>'}</code>
            </pre>
          </div>

          <div className={styles.componentCard}>
            <h3 className={styles.componentTitle}>Table with Hover</h3>
            <div className={styles.componentDemo}>
              <div className={styles.tableWrapper}>
                <table className={`${styles.table} ${styles.tableHover}`}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Alice</td>
                      <td>alice@example.com</td>
                      <td><span className={`${styles.badge} ${styles.badgeSuccess}`}>Active</span></td>
                    </tr>
                    <tr>
                      <td>Bob</td>
                      <td>bob@example.com</td>
                      <td><span className={`${styles.badge} ${styles.badgeWarning}`}>Pending</span></td>
                    </tr>
                    <tr>
                      <td>Charlie</td>
                      <td>charlie@example.com</td>
                      <td><span className={`${styles.badge} ${styles.badgeDanger}`}>Inactive</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <pre className={styles.code}>
              <code>{'<table className="table tableHover">...</table>'}</code>
            </pre>
          </div>

          <div className={styles.componentCard}>
            <h3 className={styles.componentTitle}>Compact Table</h3>
            <div className={styles.componentDemo}>
              <div className={styles.tableWrapper}>
                <table className={`${styles.table} ${styles.tableCompact}`}>
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Name</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>001</td>
                      <td>Item 1</td>
                      <td>100</td>
                    </tr>
                    <tr>
                      <td>002</td>
                      <td>Item 2</td>
                      <td>200</td>
                    </tr>
                    <tr>
                      <td>003</td>
                      <td>Item 3</td>
                      <td>300</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <pre className={styles.code}>
              <code>{'<table className="table tableCompact">...</table>'}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Badge & Alert Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Badges & Alerts</h2>
        <div className={styles.componentGrid}>
          <div className={styles.componentCard}>
            <h3 className={styles.componentTitle}>Badges</h3>
            <div className={styles.componentDemo}>
              <span className={`${styles.badge} ${styles.badgePrimary}`}>Primary</span>
              <span className={`${styles.badge} ${styles.badgeSuccess}`}>Success</span>
              <span className={`${styles.badge} ${styles.badgeWarning}`}>Warning</span>
              <span className={`${styles.badge} ${styles.badgeDanger}`}>Danger</span>
            </div>
            <pre className={styles.code}>
              <code>{'<span className="badge badgePrimary">Primary</span>'}</code>
            </pre>
          </div>

          <div className={styles.componentCard}>
            <h3 className={styles.componentTitle}>Alert Messages</h3>
            <div className={styles.componentDemo}>
              <div className={`${styles.alert} ${styles.alertSuccess}`}>
                Success alert message
              </div>
              <div className={`${styles.alert} ${styles.alertWarning}`}>
                Warning alert message
              </div>
              <div className={`${styles.alert} ${styles.alertDanger}`}>
                Danger alert message
              </div>
            </div>
            <pre className={styles.code}>
              <code>{'<div className="alert alertSuccess">...</div>'}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Modal & Toast Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Modal & Toast</h2>
        <div className={styles.componentGrid}>
          <div className={styles.componentCard}>
            <h3 className={styles.componentTitle}>Modal Dialog</h3>
            <div className={styles.componentDemo}>
              <button
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={() => setShowModal(true)}
              >
                Open Modal
              </button>
            </div>
            <pre className={styles.code}>
              <code>{'<div className="modal">...</div>'}</code>
            </pre>
          </div>

          <div className={styles.componentCard}>
            <h3 className={styles.componentTitle}>Toast Notification</h3>
            <div className={styles.componentDemo}>
              <button
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={handleShowToast}
              >
                Show Toast
              </button>
            </div>
            <pre className={styles.code}>
              <code>{'<div className="toast toastSuccess">...</div>'}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Toast Notification */}
      {showToast && (
        <div className={`${styles.toast} ${styles.toastSuccess}`}>
          Toast notification message
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Modal Title</h3>
              <button
                className={styles.modalClose}
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>This is a modal dialog component. Click outside or close button to dismiss.</p>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={`${styles.button} ${styles.buttonSecondary}`}
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={() => setShowModal(false)}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

