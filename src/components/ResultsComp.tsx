import React from 'react'
import ConfirmationComp from './ConfirmationComp';
import { useTranslation } from 'react-i18next'
import '../styles.css';
import { ProcessingResult } from '../model';
import { FaExclamationCircle } from "react-icons/fa";
import { TiTick } from "react-icons/ti";

interface Props {
    results: ProcessingResult[],
    onClose?: () => any,
}

const ResultsComp = ({results, onClose}: Props) => {

    const { t } = useTranslation();

    let resultCount = {ok: 0, fail: 0};
    results.forEach((resultItem) => {
        if(!resultItem.status) {
            resultCount.ok++;
        } else {
            resultCount.fail++;
        }
    })

    return (
        <ConfirmationComp
            externalHeading={t("results")}
            externalSaveLabel={t("ok")}
            externalShowCloseButton={false}
            canScroll={true}
            handleExternalSave={onClose}
            externalFooterContent={`${t('results')}: ${t('ok')}: ${resultCount.ok}, ${t('fail')}: ${resultCount.fail}`}
        >
            
            {results.map((processingResultItem, index) => {
                return <div key={index} className={"row" + ((index % 2 === 0) ? ' evenRowDark' : '')}>
                    <div className="col-md-8 resultsItem">
                        {processingResultItem.name}
                    </div>
                    <div style={{textAlign: 'right'}} className="col-md-4 resultsItem">
                        {
                            processingResultItem.status !== 0 &&
                            <div className='failureResultIcon'>
                                <FaExclamationCircle className='h4'/>
                            </div>
                        }
                        {
                            processingResultItem.status === 0 &&
                            <div className='successResultIcon'>
                                <TiTick className='h4'/>
                            </div>
                        }
                        {processingResultItem.result}                
                    </div>
                </div>
            })}
        </ConfirmationComp>
    )
}

export default ResultsComp
