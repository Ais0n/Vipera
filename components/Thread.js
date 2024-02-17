// components/Thread.js

import React, { useState, useRef } from 'react';
import Select from 'react-select';
import styles from '../styles/Thread.module.css';

const Thread = ({ onCloseThread }) => {

  const [reportDetails, setReportDetails] = useState({
    prompt: '',
    // visualization: [],
    visualization: '',
    harms: []
  });

  const visualizationOptions = [
    { value: 'skinTone', label: 'Skin Tone' },
    { value: 'gender', label: 'Gender' },
    { value: 'age', label: 'Age' },
  ];

  const handleSelectChange = selectedOption => {
    setReportDetails(prev => ({
      ...prev,
      visualization: selectedOption ? selectedOption.value : '' // Store the single value
    }));
  };

  const isFormFilled = reportDetails.prompt && reportDetails.visualization && reportDetails.harms.length > 0;
  
  // Handle changes for checkboxes and other inputs
  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
  
    if (type === 'checkbox') {
      const newHarms = reportDetails.harms.includes(value)
        ? reportDetails.harms.filter((harm) => harm !== value)
        : [...reportDetails.harms, value];
      setReportDetails(prev => ({ ...prev, harms: newHarms }));
    } else {
      setReportDetails(prev => ({ ...prev, [name]: value }));
    }
  };

  const [isSubmitted, setIsSubmitted] = useState(false); // track submission

  const handleSubmit = (event) => {
    event.preventDefault();
    setIsSubmitted(true); // Set isSubmitted to true when the form is submitted
  
    // Close the thread and hide the confirmation after 4.5 seconds
    setTimeout(() => {
      setIsSubmitted(false); // Hide the confirmation message
      onCloseThread(); // Close the thread
    }, 4500);
  
    // Implement submission logic here (for future use)
    console.log(reportDetails);
  };

  const harmsOptions = [
    "Stereotyping",
    "Demeaning social groups",
    "Erasing social groups",
    "Alienating social groups",
    "Cultural harm",
    "Other"
  ];
  
  const descriptions = [
    "Oversimplified and undesirable representations",
    "Differential representation or oppressing social groups",
    "Absence or unequal visibility of social groups",
    "Failure to acknowledge social groups",
    "Predominantly harming a particular culture",
    ""
  ];

  return (
    <>
      <div className={styles.overlay} onClick={onCloseThread} />
      <div className={styles.threadContainer}>
        {isSubmitted && (
          <>
            <div className={styles.overlay}></div>
            <div className={styles.confirmationContainer}>
              <span className={styles.closeButton} onClick={() => setIsSubmitted(false)}>x</span>
              <h2 className={styles.confirmationTitle}>Posted!</h2>
              <p className={styles.confirmationBody}>Your thread has been posted to the discussion forum.</p>
              <button className={styles.goToDiscussionsButton}>Go to discussions</button>
            </div>
          </>
        )}

        <h2 className={styles.threadTitle}>Create Thread</h2>
        <p className={styles.threadDescription}>
          Threads created are part of WeAudit discussion forum and are used to bring a change in text-to-image algorithms.
        </p>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="prompt">What prompt to report?</label>
            <input
              className={styles.input}
              type="text"
              id="prompt"
              name="prompt"
              value={reportDetails.prompt}
              onChange={handleInputChange}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="visualization">What are you reporting?</label>
            <Select
              name="visualization"
              options={visualizationOptions}
              className={styles.select}
              classNamePrefix="select"
              onChange={handleSelectChange}
              value={visualizationOptions.find(option => option.value === reportDetails.visualization)}
            />
          </div>

          <label className={styles.label} htmlFor="harms">What harms did you notice?</label>
          {reportDetails.prompt && reportDetails.visualization && (
            <div className={styles.formGroup}>
              {harmsOptions.map((harm, index) => (
                <div key={index} className={styles.checkboxContainer}>
                  <input
                    id={harm}
                    type="checkbox"
                    name="harms"
                    value={harm}
                    checked={reportDetails.harms.includes(harm)}
                    onChange={handleInputChange}
                  />
                  <div className={styles.checkboxTextContainer}>
                    <label htmlFor={harm} className={styles.checkboxLabel}>{harm}</label>
                    <p className={styles.checkboxDescriptionText}>{descriptions[index]}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className={styles.buttonsContainer}>
            <button className={styles.buttonCancel} onClick={onCloseThread}>Cancel</button>
            <button
              className={`${styles.buttonSubmit} ${isFormFilled ? styles.buttonActive : ''}`}
              type="submit"
              disabled={!isFormFilled} // Optionally disable the button when the form is not fully filled
            >
              Report
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default Thread;