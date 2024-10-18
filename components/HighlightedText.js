import React from 'react';

const HighlightedText = ({ raw, oldWord, newWord }) => {
    // Function to create highlighted text
    const highlightText = (text, oldWord, newWord) => {
        const regex = new RegExp(`(${oldWord})`, 'gi');
        return text.split(regex).map((part, index) => {
            if (part.toLowerCase() === oldWord.toLowerCase()) {
                return (
                    <span key={index}>
                        <span style={{ textDecoration: 'line-through' }}>
                            {part}
                        </span>
                        <strong>{` ${newWord}`}</strong>
                    </span>
                );
            }
            return part;
        });
    };

    return (
        <div style={{ marginLeft: '5px' }}>
            {highlightText(raw, oldWord, newWord)}
        </div>
    );
};

export default HighlightedText;